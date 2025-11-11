import { getPool } from '../src/database.js';

const USERS_TO_REMOVE = ['adminjosh', 'joshadmin'];
const MIN_RANDOM_DURATION = 30; // seconds
const FALLBACK_SONG_DURATION = 180; // seconds
const MAX_ADDITIONAL_LISTENS = 6;
const LIKE_REMOVAL_PROBABILITY = 0.4; // 40% chance a listener will NOT like the song

function ensureSqlDate(value: any): string {
  if (!value) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function removeUsersByUsername() {
  if (USERS_TO_REMOVE.length === 0) return;

  const pool = await getPool();
  const lowerUsernames = USERS_TO_REMOVE.map((name) => name.toLowerCase());

  const [users] = await pool.query<any[]>(
    'SELECT UserID, Username FROM userprofile WHERE LOWER(Username) IN (?)',
    [lowerUsernames]
  );

  if (!users || users.length === 0) {
    console.log('No matching users found to remove.');
    return;
  }

  const userIds: number[] = users.map((user) => user.UserID);
  const idPlaceholders = userIds.map(() => '?').join(', ');

  console.log(`Removing ${userIds.length} user(s): ${users.map((u) => u.Username).join(', ')}`);

  const relatedTables: Array<{ table: string; column: string }> = [
    { table: 'user_logins', column: 'UserID' },
    { table: 'playlist', column: 'UserID' },
    { table: 'user_likes_song', column: 'UserID' },
    { table: 'user_likes_album', column: 'UserID' },
    { table: 'user_likes_playlist', column: 'UserID' },
    { table: 'user_follows_artist', column: 'UserID' },
    { table: 'listening_history', column: 'UserID' },
    { table: 'history', column: 'UserID' }
  ];

  for (const { table, column } of relatedTables) {
    const deleteQuery = `DELETE FROM ${table} WHERE ${column} IN (${idPlaceholders})`;
    try {
      const [result] = await pool.query(deleteQuery, userIds);
      const affectedRows = (result as any)?.affectedRows ?? 0;
      if (affectedRows > 0) {
        console.log(`- Deleted ${affectedRows} row(s) from ${table}`);
      }
    } catch (error: any) {
      if (error?.code === 'ER_NO_SUCH_TABLE') {
        console.warn(`Table ${table} does not exist, skipping.`);
      } else {
        console.error(`Error deleting from ${table}:`, error.message || error);
      }
    }
  }

  const [result] = await pool.query(
    `DELETE FROM userprofile WHERE UserID IN (${idPlaceholders})`,
    userIds
  );
  const removed = (result as any)?.affectedRows ?? 0;
  console.log(`Removed ${removed} user(s) from userprofile.`);
}

async function diversifyListens() {
  const pool = await getPool();

  const [rows] = await pool.query<any[]>(
    `
      SELECT
        combo.SongID,
        combo.UserID,
        combo.listenCount,
        song.Duration AS SongDuration,
        song.ReleaseDate
      FROM (
        SELECT SongID, UserID, COUNT(*) as listenCount, MIN(ListenedAt) as firstListen
        FROM listening_history
        GROUP BY SongID, UserID
      ) combo
      JOIN song ON song.SongID = combo.SongID
      JOIN userprofile listener ON listener.UserID = combo.UserID
      WHERE listener.UserType IN ('Listener', 'Artist')
        AND listener.UserType NOT IN ('Analyst', 'Administrator', 'Developer')
    `
  );

  if (!rows || rows.length === 0) {
    console.log('No listening history found to diversify.');
    return;
  }

  const insertQuery = `
    INSERT INTO listening_history (UserID, SongID, Duration, ListenedAt)
    VALUES (?, ?, ?, ?)
  `;

  let inserted = 0;

  for (const row of rows) {
    const currentListens = Number(row.listenCount ?? 0);
    const targetListens = randomInt(1, MAX_ADDITIONAL_LISTENS);

    if (currentListens >= targetListens) {
      continue; // already diversified enough
    }

    const additional = targetListens - currentListens;
    const songDuration = Number(row.SongDuration ?? 0) > 0 ? Number(row.SongDuration) : FALLBACK_SONG_DURATION;
    const listenedAtBase = row.ReleaseDate ? new Date(row.ReleaseDate) : new Date();

    for (let i = 0; i < additional; i++) {
      const duration = Math.min(
        songDuration,
        Math.max(MIN_RANDOM_DURATION, randomInt(MIN_RANDOM_DURATION, songDuration))
      );

      const listenedAt = new Date(listenedAtBase.getTime() + randomInt(1, 30) * 60000 * (i + 1));

      await pool.query(insertQuery, [
        row.UserID,
        row.SongID,
        duration,
        ensureSqlDate(listenedAt)
      ]);
      inserted += 1;
    }
  }

  console.log(`Inserted ${inserted} additional listening events to diversify playback patterns.`);
}

async function adjustLikes() {
  const pool = await getPool();

  const [likeCountsRows] = await pool.query<any[]>(
    `
      SELECT SongID, COUNT(*) as likeCount
      FROM user_likes_song
      GROUP BY SongID
    `
  );

  if (!likeCountsRows || likeCountsRows.length === 0) {
    console.log('No song likes found.');
    return;
  }

  const likeCounts = new Map<number, number>();
  likeCountsRows.forEach((row) => likeCounts.set(Number(row.SongID), Number(row.likeCount)));

  const [likes] = await pool.query<any[]>(
    `
      SELECT SongID, UserID
      FROM user_likes_song
    `
  );

  const deleteQuery = `
    DELETE FROM user_likes_song
    WHERE SongID = ? AND UserID = ?
  `;

  let deleted = 0;

  for (const like of likes) {
    const songId = Number(like.SongID);
    const userId = Number(like.UserID);
    const currentCount = likeCounts.get(songId) ?? 0;

    if (currentCount <= 1) {
      continue; // ensure at least one like remains per song
    }

    if (Math.random() < LIKE_REMOVAL_PROBABILITY) {
      await pool.query(deleteQuery, [songId, userId]);
      likeCounts.set(songId, currentCount - 1);
      deleted += 1;
    }
  }

  console.log(`Removed ${deleted} song-like entries to diversify engagement.`);
}

async function main() {
  try {
    await removeUsersByUsername();
    await diversifyListens();
    await adjustLikes();
    console.log('Song data diversification complete.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to diversify song data:', error);
    process.exit(1);
  }
}

main();

