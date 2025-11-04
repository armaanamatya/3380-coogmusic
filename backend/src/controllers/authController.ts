import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { hash, compare } from 'bcryptjs';
import { 
  ExtendedRequest, 
  RegisterUserData, 
  LoginCredentials,
  UserProfile 
} from '../types/index.js';

// Register new user
export async function registerUser(
  pool: Pool,
  userData: RegisterUserData,
  profilePicturePath: string | null
): Promise<{ userId: number }> {
  // Check if username or email already exists
  const [existingUsers] = await pool.execute<RowDataPacket[]>(
    'SELECT UserID FROM userprofile WHERE Username = ? OR Email = ?',
    [userData.username, userData.email]
  );
  
  if (existingUsers.length > 0) {
    throw new Error('Username or email already exists');
  }

  // Hash the password
  const hashedPassword = await hash(userData.password, 10);

  // Set DateJoined to today
  const dateJoined = new Date().toISOString().split('T')[0];

  // Insert new user
  const [result] = await pool.execute<ResultSetHeader>(`
    INSERT INTO userprofile (
      Username, UserPassword, FirstName, LastName, DateOfBirth, 
      Email, UserType, DateJoined, Country, City, IsOnline, 
      AccountStatus, ProfilePicture
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
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
  ]);

  const userId = result.insertId;

  // If user type is Artist, create an artist record
  if (userData.userType === 'Artist') {
    await pool.execute(`
      INSERT INTO artist (
        ArtistID, ArtistBio, ArtistPFP, VerifiedStatus, VerifyingAdminID, DateVerified
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      userId,
      null, // ArtistBio - empty initially
      null, // ArtistPFP - no separate artist profile picture initially
      0,    // VerifiedStatus - false by default
      null, // VerifyingAdminID - no admin assigned yet
      null  // DateVerified - null until verified
    ]);
  }

  return { userId };
}

// Authenticate user login
export async function authenticateUser(
  pool: Pool,
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
  const [users] = await pool.execute<RowDataPacket[]>(
    'SELECT UserID, Username, UserPassword, UserType, FirstName, LastName, ProfilePicture FROM userprofile WHERE Username = ?',
    [credentials.username]
  );
  
  if (users.length === 0) {
    throw new Error('Invalid username or password');
  }

  const user = users[0] as any;

  // Check password
  const passwordMatch = await compare(credentials.password, user.UserPassword);
  
  if (!passwordMatch) {
    throw new Error('Invalid username or password');
  }

  // Update IsOnline status
  await pool.execute('UPDATE userprofile SET IsOnline = 1 WHERE UserID = ?', [user.UserID]);

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
export async function logoutUser(pool: Pool, userId: number): Promise<void> {
  await pool.execute('UPDATE userprofile SET IsOnline = 0 WHERE UserID = ?', [userId]);
}

