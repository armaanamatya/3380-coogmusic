import { createPool } from '../database';

const pool = createPool();

export interface ArtistProfile {
  artistId: number;
  artistBio?: string;
  artistPFP?: Buffer;
  verifiedStatus: boolean;
  verifyingAdminId?: number;
  dateVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewArtist {
  artistId: number;
  artistBio?: string;
  artistPFP?: Buffer;
}

export interface UpdateArtistProfile {
  artistBio?: string;
  artistPFP?: Buffer;
}


export const validateArtistInput = (artist: Partial<NewArtist>): string[] => {
  const errors: string[] = [];

  if (artist.artistBio && artist.artistBio.length > 500) {
    errors.push('Artist bio must be 500 characters or less');
  }

  if (artist.artistBio && artist.artistBio.trim().length === 0) {
    errors.push('Artist bio cannot be empty if provided');
  }

  if (artist.artistPFP && artist.artistPFP.length > 15 * 1024 * 1024) {
    errors.push('Profile picture must be less than 15MB');
  }

  return errors;
};


export const createArtistProfile = async (artist: NewArtist) => {
  const validationErrors = validateArtistInput(artist);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }

  const sql = `
    INSERT INTO artist 
    (ArtistID, ArtistBio, ArtistPFP)
    VALUES (?, ?, ?);
  `;

  const values = [
    artist.artistId,
    artist.artistBio || null,
    artist.artistPFP || null
  ];

  try {
    const result = pool.prepare(sql).run(...(values));
    return result;
  } catch (error: any) {
    if (error.code === error.message && error.message.includes('UNIQUE constraint failed')) {
      throw new Error('Artist profile already exists for this user');
    }
    throw error;
  }
};


export const getArtistById = async (artistId: number) => {
  const sql = `
    SELECT a.*, u.Username, u.FirstName, u.LastName, u.Email, u.DateJoined, u.Country, u.City
    FROM artist a
    JOIN userprofile u ON a.ArtistID = u.UserID
    WHERE a.ArtistID = ?;
  `;
  const rows = pool.prepare(sql).all(artistId);
  return (rows as any[])[0];
};


export const getAllArtists = async (includeUnverified = true) => {
  const sql = includeUnverified 
    ? `
        SELECT a.*, u.Username, u.FirstName, u.LastName, u.Email, u.DateJoined, u.Country, u.City
        FROM artist a
        JOIN userprofile u ON a.ArtistID = u.UserID
        ORDER BY u.Username;
      `
    : `
        SELECT a.*, u.Username, u.FirstName, u.LastName, u.Email, u.DateJoined, u.Country, u.City
        FROM artist a
        JOIN userprofile u ON a.ArtistID = u.UserID
        WHERE a.VerifiedStatus = 1
        ORDER BY u.Username;
      `;
  
  const rows = pool.prepare(sql).all();
  return rows;
};


export const updateArtistProfile = async (artistId: number, updates: UpdateArtistProfile) => {
  const validationErrors = validateArtistInput({ artistId, ...updates });
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }

  const setClauses: string[] = [];
  const params: any[] = [];

  if (updates.artistBio !== undefined) {
    setClauses.push('ArtistBio = ?');
    params.push(updates.artistBio || null);
  }

  if (updates.artistPFP !== undefined) {
    setClauses.push('ArtistPFP = ?');
    params.push(updates.artistPFP || null);
  }

  if (setClauses.length === 0) {
    throw new Error('No valid fields provided to update.');
  }

  setClauses.push('UpdatedAt = CURRENT_TIMESTAMP');
  params.push(artistId);

  const sql = `UPDATE artist SET ${setClauses.join(', ')} WHERE ArtistID = ?`;

  const result = pool.prepare(sql).run(...(params));
  return result;
};


export const verifyArtist = async (artistId: number, adminId: number) => {
  const sql = `
    UPDATE artist 
    SET VerifiedStatus = 1, VerifyingAdminID = ?, DateVerified = CURRENT_TIMESTAMP, UpdatedAt = CURRENT_TIMESTAMP
    WHERE ArtistID = ?;
  `;
  
  const result = pool.prepare(sql).run(...([adminId, artistId]));
  return result;
};


export const unverifyArtist = async (artistId: number) => {
  const sql = `
    UPDATE artist 
    SET VerifiedStatus = 0, VerifyingAdminID = ?, DateVerified = NULL, UpdatedAt = CURRENT_TIMESTAMP
    WHERE ArtistID = ?;
  `;
  
  const result = pool.prepare(sql).run(...([artistId]));
  return result;
};

// Delete artist profile (doesn't delete the user)
export const deleteArtistProfile = async (artistId: number) => {
  const sql = `DELETE FROM artist WHERE ArtistID = ?`;
  const result = pool.prepare(sql).run(...([artistId]));
  return result;
};


export const getArtistsByVerificationStatus = async (verified: boolean) => {
  const sql = `
    SELECT a.*, u.Username, u.FirstName, u.LastName, u.Email, u.DateJoined, u.Country, u.City
    FROM artist a
    JOIN userprofile u ON a.ArtistID = u.UserID
    WHERE a.VerifiedStatus = ?
    ORDER BY u.Username;
  `;
  
  const rows = pool.prepare(sql).all(verified ? 1 : 0);
  return rows;
};

// Search artists by name or bio
export const searchArtists = async (query: string) => {
  const sql = `
    SELECT a.*, u.Username, u.FirstName, u.LastName, u.Email, u.DateJoined, u.Country, u.City
    FROM artist a
    JOIN userprofile u ON a.ArtistID = u.UserID
    WHERE u.Username LIKE ? OR u.FirstName LIKE ? OR u.LastName LIKE ? OR a.ArtistBio LIKE ?
    ORDER BY u.Username;
  `;
  
  const searchTerm = `%${query}%`;
  const rows = pool.prepare(sql).all(searchTerm, searchTerm, searchTerm, searchTerm);
  return rows;
};

