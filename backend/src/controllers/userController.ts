import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface UserProfile {
  UserID: number;
  Username: string;
  FirstName: string;
  LastName: string;
  DateOfBirth: string;
  Email: string;
  UserType: string;
  DateJoined: string;
  Country: string;
  City: string | null;
  AccountStatus: string;
  IsOnline: number;
  LastLogin: string | null;
  ProfilePicture: string | null;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface UpdateUserData {
  Username?: string;
  FirstName?: string;
  LastName?: string;
  Email?: string;
  Country?: string;
  City?: string;
  DateOfBirth?: string;
}

// Get user by ID
export async function getUserById(pool: Pool, userId: number): Promise<UserProfile | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT UserID, Username, FirstName, LastName, DateOfBirth, Email, 
           UserType, DateJoined, Country, City, AccountStatus, IsOnline, 
           LastLogin, ProfilePicture, CreatedAt, UpdatedAt
    FROM userprofile 
    WHERE UserID = ?
  `, [userId]);

  return rows.length > 0 ? (rows[0] as UserProfile) : null;
}

// Get user by username
export async function getUserByUsername(pool: Pool, username: string): Promise<UserProfile | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT UserID, Username, FirstName, LastName, DateOfBirth, Email, 
           UserType, DateJoined, Country, City, AccountStatus, IsOnline, 
           LastLogin, ProfilePicture, CreatedAt, UpdatedAt
    FROM userprofile 
    WHERE Username = ?
  `, [username]);

  return rows.length > 0 ? (rows[0] as UserProfile) : null;
}

// Get all users with pagination
export async function getAllUsers(
  pool: Pool,
  filters: { page?: number; limit?: number; userType?: string }
): Promise<UserProfile[]> {
  const { page = 1, limit = 50, userType } = filters;

  let query = `
    SELECT UserID, Username, FirstName, LastName, DateOfBirth, Email, 
           UserType, DateJoined, Country, City, AccountStatus, IsOnline, 
           LastLogin, ProfilePicture, CreatedAt, UpdatedAt
    FROM userprofile
    WHERE 1=1
  `;

  const params: any[] = [];

  if (userType) {
    query += ' AND UserType = ?';
    params.push(userType);
  }

  query += ' ORDER BY DateJoined DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  const [rows] = await pool.execute<RowDataPacket[]>(query, params);
  return rows as UserProfile[];
}

// Update user profile
export async function updateUser(
  pool: Pool,
  userId: number,
  updateData: UpdateUserData
): Promise<void> {
  // Check if user exists
  const [existingUsers] = await pool.execute<RowDataPacket[]>(
    'SELECT UserID FROM userprofile WHERE UserID = ?', 
    [userId]
  );
  if (existingUsers.length === 0) {
    throw new Error('User not found');
  }

  // Build update query dynamically
  const allowedFields = ['Username', 'FirstName', 'LastName', 'Email', 'Country', 'City', 'DateOfBirth'];
  const updates: string[] = [];
  const values: any[] = [];

  allowedFields.forEach((field) => {
    if (updateData[field as keyof UpdateUserData] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(updateData[field as keyof UpdateUserData]);
    }
  });

  if (updates.length === 0) {
    throw new Error('No valid fields to update');
  }

  // UpdatedAt is handled automatically by ON UPDATE CURRENT_TIMESTAMP in MySQL
  values.push(userId);
  const updateQuery = `UPDATE userprofile SET ${updates.join(', ')} WHERE UserID = ?`;

  try {
    await pool.execute(updateQuery, values);
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes('Username')) {
      throw new Error('Username already exists');
    } else if (error.code === 'ER_DUP_ENTRY' && error.message.includes('Email')) {
      throw new Error('Email already exists');
    }
    throw error;
  }
}

// Update user type
export async function updateUserType(
  pool: Pool,
  userId: number,
  userType: 'Listener' | 'Artist' | 'Administrator' | 'Developer'
): Promise<void> {
  const [users] = await pool.execute<RowDataPacket[]>(
    'SELECT UserID FROM userprofile WHERE UserID = ?', 
    [userId]
  );
  if (users.length === 0) {
    throw new Error('User not found');
  }

  await pool.execute('UPDATE userprofile SET UserType = ? WHERE UserID = ?', [userType, userId]);
}

// Update online status
export async function updateOnlineStatus(pool: Pool, userId: number, isOnline: boolean): Promise<void> {
  const [users] = await pool.execute<RowDataPacket[]>(
    'SELECT UserID FROM userprofile WHERE UserID = ?', 
    [userId]
  );
  if (users.length === 0) {
    throw new Error('User not found');
  }

  await pool.execute('UPDATE userprofile SET IsOnline = ? WHERE UserID = ?', [isOnline ? 1 : 0, userId]);
}

// Update account status
export async function updateAccountStatus(
  pool: Pool,
  userId: number,
  status: 'Active' | 'Suspended' | 'Banned'
): Promise<void> {
  const [users] = await pool.execute<RowDataPacket[]>(
    'SELECT UserID FROM userprofile WHERE UserID = ?', 
    [userId]
  );
  if (users.length === 0) {
    throw new Error('User not found');
  }

  await pool.execute('UPDATE userprofile SET AccountStatus = ? WHERE UserID = ?', [status, userId]);
}

// Update last login time
export async function updateLastLogin(pool: Pool, userId: number): Promise<void> {
  await pool.execute(`
    UPDATE userprofile 
    SET LastLogin = CURRENT_TIMESTAMP 
    WHERE UserID = ?
  `, [userId]);
}

// Update profile picture
export async function updateProfilePicture(pool: Pool, userId: number, profilePicturePath: string): Promise<void> {
  const [users] = await pool.execute<RowDataPacket[]>(
    'SELECT UserID FROM userprofile WHERE UserID = ?', 
    [userId]
  );
  if (users.length === 0) {
    throw new Error('User not found');
  }

  await pool.execute('UPDATE userprofile SET ProfilePicture = ? WHERE UserID = ?', [profilePicturePath, userId]);
}

// Delete user
export async function deleteUser(pool: Pool, userId: number): Promise<void> {
  const [users] = await pool.execute<RowDataPacket[]>(
    'SELECT UserID FROM userprofile WHERE UserID = ?', 
    [userId]
  );
  if (users.length === 0) {
    throw new Error('User not found');
  }

  await pool.execute('DELETE FROM userprofile WHERE UserID = ?', [userId]);
}

// Search users
export async function searchUsers(
  pool: Pool,
  query: string,
  filters: { page?: number; limit?: number }
): Promise<UserProfile[]> {
  const { page = 1, limit = 50 } = filters;
  const searchTerm = `%${query}%`;

  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT UserID, Username, FirstName, LastName, DateOfBirth, Email, 
           UserType, DateJoined, Country, City, AccountStatus, IsOnline, 
           LastLogin, ProfilePicture, CreatedAt, UpdatedAt
    FROM userprofile
    WHERE Username LIKE ? OR FirstName LIKE ? OR LastName LIKE ? OR Email LIKE ?
    ORDER BY Username
    LIMIT ? OFFSET ?
  `, [searchTerm, searchTerm, searchTerm, searchTerm, limit, (page - 1) * limit]);
  
  return rows as UserProfile[];
}

