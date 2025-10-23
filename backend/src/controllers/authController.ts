import { Database } from 'better-sqlite3';
import { hash, compare } from 'bcryptjs';
import { 
  ExtendedRequest, 
  RegisterUserData, 
  LoginCredentials,
  UserProfile 
} from '../types/index.js';

// Register new user
export async function registerUser(
  db: Database,
  userData: RegisterUserData,
  profilePicturePath: string | null
): Promise<{ userId: number }> {
  // Check if username or email already exists
  const existingUser = db.prepare(
    'SELECT UserID FROM userprofile WHERE Username = ? OR Email = ?'
  ).get(userData.username, userData.email);
  
  if (existingUser) {
    throw new Error('Username or email already exists');
  }

  // Hash the password
  const hashedPassword = await hash(userData.password, 10);

  // Set DateJoined to today
  const dateJoined = new Date().toISOString().split('T')[0];

  // Insert new user
  const stmt = db.prepare(`
    INSERT INTO userprofile (
      Username, UserPassword, FirstName, LastName, DateOfBirth, 
      Email, UserType, DateJoined, Country, City, IsOnline, 
      AccountStatus, ProfilePicture
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    userData.username,
    hashedPassword,
    userData.firstName,
    userData.lastName,
    userData.dateOfBirth,
    userData.email,
    userData.userType,
    dateJoined,
    userData.country,
    userData.city || null,
    0, // IsOnline = false
    'Active', // AccountStatus
    profilePicturePath
  );

  return { userId: Number(result.lastInsertRowid) };
}

// Authenticate user login
export async function authenticateUser(
  db: Database,
  credentials: LoginCredentials
): Promise<{
  userId: number;
  username: string;
  userType: string;
  firstName: string;
  lastName: string;
  profilePicture: string | null;
}> {
  // Find user by username
  const user = db.prepare(
    'SELECT UserID, Username, UserPassword, UserType, FirstName, LastName, ProfilePicture FROM userprofile WHERE Username = ?'
  ).get(credentials.username) as UserProfile | undefined;
  
  if (!user) {
    throw new Error('Invalid username or password');
  }

  // Check password
  const passwordMatch = await compare(credentials.password, user.UserPassword);
  
  if (!passwordMatch) {
    throw new Error('Invalid username or password');
  }

  // Update IsOnline status
  db.prepare('UPDATE userprofile SET IsOnline = 1 WHERE UserID = ?').run(user.UserID);

  return {
    userId: user.UserID,
    username: user.Username,
    userType: user.UserType,
    firstName: user.FirstName,
    lastName: user.LastName,
    profilePicture: user.ProfilePicture
  };
}

// Logout user
export function logoutUser(db: Database, userId: number): void {
  db.prepare('UPDATE userprofile SET IsOnline = 0 WHERE UserID = ?').run(userId);
}

