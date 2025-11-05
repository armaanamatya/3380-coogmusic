import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface UserLogin {
  LoginID: number;
  UserID: number;
  LoginDate: Date;
  LogoutDate: Date | null;
  LoginSession: number | null;
  SongsPlayed: number;
  SongsLiked: number;
  ArtistsFollowed: number;
  SongsUploaded: number;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface CreateLoginData {
  userId: number;
}

export interface UpdateLoginData {
  songsPlayed?: number;
  songsLiked?: number;
  artistsFollowed?: number;
  songsUploaded?: number;
}

// Create a new login record
export async function createLogin(
  pool: Pool,
  data: CreateLoginData
): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(`
    INSERT INTO user_logins (UserID, LoginDate)
    VALUES (?, NOW())
  `, [data.userId]);

  return result.insertId;
}

// Get the most recent active login (not logged out) for a user
export async function getActiveLogin(
  pool: Pool,
  userId: number
): Promise<UserLogin | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT LoginID, UserID, LoginDate, LogoutDate, LoginSession,
           SongsPlayed, SongsLiked, ArtistsFollowed, SongsUploaded,
           CreatedAt, UpdatedAt
    FROM user_logins
    WHERE UserID = ? AND LogoutDate IS NULL
    ORDER BY LoginDate DESC
    LIMIT 1
  `, [userId]);

  return rows.length > 0 ? (rows[0] as UserLogin) : null;
}

// Update login record with activity counters
export async function updateLoginActivity(
  pool: Pool,
  loginId: number,
  data: UpdateLoginData
): Promise<void> {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.songsPlayed !== undefined) {
    updates.push('SongsPlayed = SongsPlayed + ?');
    values.push(data.songsPlayed);
  }
  if (data.songsLiked !== undefined) {
    updates.push('SongsLiked = SongsLiked + ?');
    values.push(data.songsLiked);
  }
  if (data.artistsFollowed !== undefined) {
    updates.push('ArtistsFollowed = ArtistsFollowed + ?');
    values.push(data.artistsFollowed);
  }
  if (data.songsUploaded !== undefined) {
    updates.push('SongsUploaded = SongsUploaded + ?');
    values.push(data.songsUploaded);
  }

  if (updates.length === 0) {
    return; // No updates to make
  }

  values.push(loginId);

  await pool.execute(`
    UPDATE user_logins
    SET ${updates.join(', ')}, UpdatedAt = NOW()
    WHERE LoginID = ?
  `, values);
}

// Logout user - update logout date and calculate session duration
export async function logoutLogin(
  pool: Pool,
  loginId: number
): Promise<void> {
  await pool.execute(`
    UPDATE user_logins
    SET LogoutDate = NOW(),
        LoginSession = TIMESTAMPDIFF(SECOND, LoginDate, NOW()),
        UpdatedAt = NOW()
    WHERE LoginID = ?
  `, [loginId]);
}

// Get all active logins that need to be logged out due to inactivity (1 hour)
export async function getInactiveLogins(pool: Pool): Promise<UserLogin[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT LoginID, UserID, LoginDate, LogoutDate, LoginSession,
           SongsPlayed, SongsLiked, ArtistsFollowed, SongsUploaded,
           CreatedAt, UpdatedAt
    FROM user_logins
    WHERE LogoutDate IS NULL
      AND TIMESTAMPDIFF(SECOND, LoginDate, NOW()) >= 3600
  `);

  return rows as UserLogin[];
}

