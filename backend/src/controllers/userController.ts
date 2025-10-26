import { Database } from 'better-sqlite3';

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
export function getUserById(db: Database, userId: number): UserProfile | null {
  const user = db.prepare(`
    SELECT UserID, Username, FirstName, LastName, DateOfBirth, Email, 
           UserType, DateJoined, Country, City, AccountStatus, IsOnline, 
           LastLogin, ProfilePicture, CreatedAt, UpdatedAt
    FROM userprofile 
    WHERE UserID = ?
  `).get(userId) as UserProfile | undefined;

  return user || null;
}

// Get user by username
export function getUserByUsername(db: Database, username: string): UserProfile | null {
  const user = db.prepare(`
    SELECT UserID, Username, FirstName, LastName, DateOfBirth, Email, 
           UserType, DateJoined, Country, City, AccountStatus, IsOnline, 
           LastLogin, ProfilePicture, CreatedAt, UpdatedAt
    FROM userprofile 
    WHERE Username = ?
  `).get(username) as UserProfile | undefined;

  return user || null;
}

// Get all users with pagination
export function getAllUsers(
  db: Database,
  filters: { page?: number; limit?: number; userType?: string }
): UserProfile[] {
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

  return db.prepare(query).all(...params) as UserProfile[];
}

// Update user profile
export function updateUser(
  db: Database,
  userId: number,
  updateData: UpdateUserData
): void {
  // Check if user exists
  const existingUser = db.prepare('SELECT UserID FROM userprofile WHERE UserID = ?').get(userId);
  if (!existingUser) {
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

  // Add UpdatedAt timestamp
  updates.push(`UpdatedAt = DATETIME('now')`);
  
  values.push(userId);
  const updateQuery = `UPDATE userprofile SET ${updates.join(', ')} WHERE UserID = ?`;

  try {
    db.prepare(updateQuery).run(...values);
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed: userprofile.Username')) {
      throw new Error('Username already exists');
    } else if (error.message.includes('UNIQUE constraint failed: userprofile.Email')) {
      throw new Error('Email already exists');
    }
    throw error;
  }
}

// Update user type
export function updateUserType(
  db: Database,
  userId: number,
  userType: 'Listener' | 'Artist' | 'Administrator' | 'Developer'
): void {
  const user = db.prepare('SELECT UserID FROM userprofile WHERE UserID = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  db.prepare('UPDATE userprofile SET UserType = ? WHERE UserID = ?').run(userType, userId);
}

// Update online status
export function updateOnlineStatus(db: Database, userId: number, isOnline: boolean): void {
  const user = db.prepare('SELECT UserID FROM userprofile WHERE UserID = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  db.prepare('UPDATE userprofile SET IsOnline = ? WHERE UserID = ?').run(isOnline ? 1 : 0, userId);
}

// Update account status
export function updateAccountStatus(
  db: Database,
  userId: number,
  status: 'Active' | 'Suspended' | 'Banned'
): void {
  const user = db.prepare('SELECT UserID FROM userprofile WHERE UserID = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  db.prepare('UPDATE userprofile SET AccountStatus = ? WHERE UserID = ?').run(status, userId);
}

// Update last login time
export function updateLastLogin(db: Database, userId: number): void {
  db.prepare(`
    UPDATE userprofile 
    SET LastLogin = CURRENT_TIMESTAMP 
    WHERE UserID = ?
  `).run(userId);
}

// Update profile picture
export function updateProfilePicture(db: Database, userId: number, profilePicturePath: string): void {
  const user = db.prepare('SELECT UserID FROM userprofile WHERE UserID = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  db.prepare('UPDATE userprofile SET ProfilePicture = ? WHERE UserID = ?')
    .run(profilePicturePath, userId);
}

// Delete user
export function deleteUser(db: Database, userId: number): void {
  const user = db.prepare('SELECT UserID FROM userprofile WHERE UserID = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  db.prepare('DELETE FROM userprofile WHERE UserID = ?').run(userId);
}

// Search users
export function searchUsers(
  db: Database,
  query: string,
  filters: { page?: number; limit?: number }
): UserProfile[] {
  const { page = 1, limit = 50 } = filters;
  const searchTerm = `%${query}%`;

  return db.prepare(`
    SELECT UserID, Username, FirstName, LastName, DateOfBirth, Email, 
           UserType, DateJoined, Country, City, AccountStatus, IsOnline, 
           LastLogin, ProfilePicture, CreatedAt, UpdatedAt
    FROM userprofile
    WHERE Username LIKE ? OR FirstName LIKE ? OR LastName LIKE ? OR Email LIKE ?
    ORDER BY Username
    LIMIT ? OFFSET ?
  `).all(searchTerm, searchTerm, searchTerm, searchTerm, limit, (page - 1) * limit) as UserProfile[];
}

