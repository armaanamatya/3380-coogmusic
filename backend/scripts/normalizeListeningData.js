import { getPool } from '../src/database.js';
const MIN_DEFAULT_DURATION = 45; // seconds
const FALLBACK_DURATION = 180; // seconds
function toSqlDate(value) {
    if (!value) {
        return new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
    return date.toISOString().slice(0, 19).replace('T', ' ');
}
async function clampListeningDurations() {
    const pool = await getPool();
    const [result] = await pool.query(`
      UPDATE listening_history lh
      JOIN song s ON lh.SongID = s.SongID
      SET
        lh.Duration = LEAST(
          CASE
            WHEN lh.Duration IS NULL OR lh.Duration <= 0 THEN COALESCE(s.Duration, ?)
            ELSE lh.Duration
          END,
          COALESCE(s.Duration, ?)
        ),
        lh.ListenedAt = COALESCE(lh.ListenedAt, s.ReleaseDate, NOW())
      WHERE lh.Duration IS NULL OR lh.Duration <= 0 OR (s.Duration IS NOT NULL AND lh.Duration > s.Duration)
    `, [FALLBACK_DURATION, FALLBACK_DURATION]);
    console.log(`Adjusted durations for ${result.affectedRows ?? 0} listening_history rows.`);
}
async function ensureListensForLikes() {
    const pool = await getPool();
    const [rows] = await pool.query(`
      SELECT
        uls.SongID,
        uls.UserID,
        uls.LikedAt,
        s.Duration AS SongDuration,
        s.ReleaseDate
      FROM user_likes_song uls
      LEFT JOIN listening_history lh
        ON lh.UserID = uls.UserID
        AND lh.SongID = uls.SongID
      JOIN song s ON uls.SongID = s.SongID
      WHERE lh.UserID IS NULL
    `);
    if (!rows || rows.length === 0) {
        console.log('All song likes already have corresponding listen records.');
        return;
    }
    const insertQuery = `
    INSERT INTO listening_history (UserID, SongID, Duration, ListenedAt)
    VALUES (?, ?, ?, ?)
  `;
    let inserted = 0;
    for (const row of rows) {
        const songDuration = Number(row.SongDuration ?? 0);
        const baseDuration = songDuration > 0
            ? Math.max(MIN_DEFAULT_DURATION, Math.round(songDuration * 0.7))
            : FALLBACK_DURATION;
        const clampedDuration = songDuration > 0 ? Math.min(baseDuration, songDuration) : baseDuration;
        const listenedAt = row.LikedAt ? toSqlDate(row.LikedAt) : toSqlDate(row.ReleaseDate);
        await pool.query(insertQuery, [row.UserID, row.SongID, clampedDuration, listenedAt]);
        inserted += 1;
    }
    console.log(`Inserted ${inserted} synthetic listening_history rows to satisfy like constraints.`);
}
async function main() {
    try {
        await clampListeningDurations();
        await ensureListensForLikes();
        console.log('Data normalization complete.');
        process.exit(0);
    }
    catch (error) {
        console.error('Failed to normalize listening data:', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=normalizeListeningData.js.map