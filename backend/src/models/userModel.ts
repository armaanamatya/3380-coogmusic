import { createPool } from '../database';

const pool = createPool();

export interface NewUser {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  email: string;
  country: string;
  city?: string;
}


export const insertUser = async (user: NewUser) => {
  const validationErrors = validateUserInput(user);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }

  const sql = `
    INSERT INTO userprofile 
    (Username, UserPassword, FirstName, LastName, DateOfBirth, Email, UserType, DateJoined, Country, City, AccountStatus)
    VALUES (?, ?, ?, ?, ?, ?, 'Listener', DATE('now'), ?, ?, 'Active');
  `;

  const values = [
    user.username,
    user.password,
    user.firstName,
    user.lastName,
    user.dateOfBirth.toISOString().slice(0, 10),
    user.email,
    user.country,
    user.city || null
  ];

  const result = pool.prepare(sql).run(...(values));
  return result;
};


export const validateUserInput = (user: NewUser): string[] => {
  const errors: string[] = [];
  
  if (user.username.length < 3 || user.username.length > 30) {
    errors.push('Username must be between 3 and 30 characters');
  }
  if (!user.username.match(/^[A-Za-z0-9]+$/)) {
    errors.push('Username can only contain letters and numbers');
  }

  if (user.password.length < 8 || user.username.length > 30) {
    errors.push('Username must be between 8 and 30 characters');
  }

  if (!user.firstName.match(/^[A-Za-z]+$/)) {
    errors.push('First name can only contain letters');
  }
  if (user.firstName.length < 1 || user.firstName.length > 30) {
    errors.push('First name must be between 1 and 30 characters');
  }

  if (!user.lastName.match(/^[A-Za-z]+$/)) {
    errors.push('Last name can only contain letters');
  }
  if (user.lastName.length < 1 || user.lastName.length > 30) {
    errors.push('Last name must be between 1 and 30 characters');
  }

  if (!user.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push('Invalid email format');
  }

  const today = new Date();
  const minDate = new Date('1925-01-01');
  const maxDate = new Date(); 
  if (user.dateOfBirth > maxDate) {
    errors.push('Date of birth cannot be in the future');
  }
  if (user.dateOfBirth < minDate) {
    errors.push('Date of birth cannot be before January 1, 1925');
  }
  
  if (!user.country.match(/^[A-Za-z\s]+$/)) {
    errors.push('Country can only contain letters and spaces');
  } 
  if (user.country.length < 2 || user.country.length > 30) {
    errors.push('Country must be between 2 and 30 characters');
  }

  if (user.city && !user.city.match(/^[A-Za-z\s]+$/)) {
    errors.push('City can only contain letters and spaces');
  }
  if (user.city && (user.city.length < 1 || user.city.length > 30)) {
    errors.push('City must be between 1 and 30 characters');
  }
  
  return errors;
};


export const getUserById = async (userId: number) => {
  const sql = `SELECT * FROM userprofile WHERE UserID = ?`;
  const rows = pool.prepare(sql).all(userId);
  return rows;
};


export const getUserByUsername = async (username: string) => {
  const sql = `SELECT * FROM userprofile WHERE Username = ?`;
  const rows = pool.prepare(sql).all(username);
  return rows;
};


export const getAllUsers = async () => {
  const sql = `SELECT * FROM userprofile`;
  const rows = pool.prepare(sql).all();
  return rows;
};


export const updateUser = async (userId: number, updatedFields: Partial<NewUser>) => {
  const currentUsers = await getUserById(userId);
  if (!currentUsers || (currentUsers as any[]).length === 0) {
    throw new Error('User not found');
  }
  
  const currentUser = (currentUsers as any[])[0];

  const hasValidatableFields = Object.keys(updatedFields).some(key => 
    ['username', 'firstName', 'lastName', 'dateOfBirth', 'email', 'country', 'city'].includes(key)
  );

  if (hasValidatableFields) {
    const mockUserForValidation: NewUser = {
      username: updatedFields.username || currentUser.Username,
      firstName: updatedFields.firstName || currentUser.FirstName,
      lastName: updatedFields.lastName || currentUser.LastName,
      dateOfBirth: updatedFields.dateOfBirth || new Date(currentUser.DateOfBirth),
      email: updatedFields.email || currentUser.Email,
      country: updatedFields.country || currentUser.Country,
      city: updatedFields.city !== undefined ? updatedFields.city : currentUser.City,
      password: 'temp'
    };

    const validationErrors = validateUserInput(mockUserForValidation);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
  }

  const columnMap: Record<keyof Partial<NewUser>, string> = {
    username: 'Username',
    password: 'UserPassword',
    firstName: 'FirstName',
    lastName: 'LastName',
    dateOfBirth: 'DateOfBirth',
    email: 'Email',
    country: 'Country',
    city: 'City',
  };

  const entries = Object.entries(updatedFields)
    .filter(([key, value]) => value !== undefined && key in columnMap) as [keyof Partial<NewUser>, any][];

  if (entries.length === 0) {
    throw new Error('No valid fields provided to update.');
  }

  const setClauses: string[] = [];
  const params: any[] = [];

  params.push(userId);

  const sql = `UPDATE userprofile SET ${setClauses.join(', ')} WHERE UserID = ?`;

  try {
    const result = pool.prepare(sql).run(...(params));
    return result;
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      if (error.message.includes('Username')) {
        throw new Error('Username already exists');
      } else if (error.message.includes('Email')) {
        throw new Error('Email already exists');
      }
    }
    throw error;
  }
};


export const updateType = async (userId: number, newType: string) => {
  const allowedTypes = ['Listener', 'Administrator', 'Artist', 'Developer'];
  if (!allowedTypes.includes(newType)) {
    throw new Error(`Invalid UserType. Allowed types: ${allowedTypes.join(', ')}`);
  }

  const sql = `UPDATE userprofile SET UserType = ? WHERE UserID = ?`;
  const result = pool.prepare(sql).run(...([newType, userId]));
  return result;
};


export const updateOnlineStatus = async (userId: number, isOnline: boolean) => {
  const sql = `UPDATE userprofile SET IsOnline = ? WHERE UserID = ?`;
  const result = pool.prepare(sql).run(...([isOnline, userId]));
  return result;
};


export const activateUser = async (userId: number) => {
  const sql = `UPDATE userprofile SET AccountStatus = 'Active' WHERE UserID = ?`;
  const result = pool.prepare(sql).run(...([userId]));
  return result;
};


export const deactivateUser = async (userId: number) => {
  const sql = `UPDATE userprofile SET AccountStatus = 'Suspended' WHERE UserID = ?`;
  const result = pool.prepare(sql).run(...([userId]));
  return result;
};


export const banUser = async (userId: number) => {
  const sql = `UPDATE userprofile SET AccountStatus = 'Banned' WHERE UserID = ?`;
  const result = pool.prepare(sql).run(...([userId]));
  return result;
};


export const deleteUser = async (userId: number) => {
  const sql = `DELETE FROM userprofile WHERE UserID = ?`;
  const result = pool.prepare(sql).run(...([userId]));
  return result;
};