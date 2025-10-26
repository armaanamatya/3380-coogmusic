import { createPool } from '../database';

const pool = createPool();

export interface UserLike {
  userId: number;
  likedAt: Date;
}

export interface SongLike extends UserLike {
  songId: number;
}

export interface AlbumLike extends UserLike {
  albumId: number;
}

export interface PlaylistLike extends UserLike {
  playlistId: number;
}

export const likeSong = async (userId: number, songId: number) => {
  const sql = `
    INSERT INTO user_likes_song (UserID, SongID)
    VALUES (?, ?)
  `;
  
  try {
    const result = pool.prepare(sql).run(...([userId, songId]));
    return result;
  } catch (error: any) {
    if (error.code === error.message && error.message.includes('UNIQUE constraint failed')) {
      throw new Error('User has already liked this song');
    }
    if (error.code === error.message && error.message.includes('FOREIGN KEY constraint failed')) {
      throw new Error('User or song does not exist');
    }
    throw error;
  }
};

export const unlikeSong = async (userId: number, songId: number) => {
  const sql = `DELETE FROM user_likes_song WHERE UserID = ? AND SongID = ?`;
  const result = pool.prepare(sql).run(...([userId, songId]));
  return result;
};

export const likeAlbum = async (userId: number, albumId: number) => {
  const sql = `
    INSERT INTO user_likes_album (UserID, AlbumID)
    VALUES (?, ?)
  `;
  
  try {
    const result = pool.prepare(sql).run(...([userId, albumId]));
    return result;
  } catch (error: any) {
    if (error.code === error.message && error.message.includes('UNIQUE constraint failed')) {
      throw new Error('User has already liked this album');
    }
    if (error.code === error.message && error.message.includes('FOREIGN KEY constraint failed')) {
      throw new Error('User or album does not exist');
    }
    throw error;
  }
};

export const unlikeAlbum = async (userId: number, albumId: number) => {
  const sql = `DELETE FROM user_likes_album WHERE UserID = ? AND AlbumID = ?`;
  const result = pool.prepare(sql).run(...([userId, albumId]));
  return result;
};

export const likePlaylist = async (userId: number, playlistId: number) => {
  const sql = `
    INSERT INTO user_likes_playlist (UserID, PlaylistID)
    VALUES (?, ?)
  `;
  
  try {
    const result = pool.prepare(sql).run(...([userId, playlistId]));
    return result;
  } catch (error: any) {
    if (error.code === error.message && error.message.includes('UNIQUE constraint failed')) {
      throw new Error('User has already liked this playlist');
    }
    if (error.code === error.message && error.message.includes('FOREIGN KEY constraint failed')) {
      throw new Error('User or playlist does not exist');
    }
    throw error;
  }
};

export const unlikePlaylist = async (userId: number, playlistId: number) => {
  const sql = `DELETE FROM user_likes_playlist WHERE UserID = ? AND PlaylistID = ?`;
  const result = pool.prepare(sql).run(...([userId, playlistId]));
  return result;
};

export const getUserLikedSongs = async (userId: number) => {
  const sql = `
    SELECT s.*, u.Username, u.FirstName, u.LastName, a.AlbumName, uls.LikedAt
    FROM user_likes_song uls
    JOIN song s ON uls.SongID = s.SongID
    JOIN artist ar ON s.ArtistID = ar.ArtistID
    JOIN userprofile u ON ar.ArtistID = u.UserID
    LEFT JOIN album a ON s.AlbumID = a.AlbumID
    WHERE uls.UserID = ?
    ORDER BY uls.LikedAt DESC;
  `;
  
  const rows = pool.prepare(sql).all(userId);
  return rows;
};

export const getUserLikedAlbums = async (userId: number) => {
  const sql = `
    SELECT a.*, u.Username, u.FirstName, u.LastName, ula.LikedAt
    FROM user_likes_album ula
    JOIN album a ON ula.AlbumID = a.AlbumID
    JOIN artist ar ON a.ArtistID = ar.ArtistID
    JOIN userprofile u ON ar.ArtistID = u.UserID
    WHERE ula.UserID = ?
    ORDER BY ula.LikedAt DESC;
  `;
  
  const rows = pool.prepare(sql).all(userId);
  return rows;
};

export const getUserLikedPlaylists = async (userId: number) => {
  const sql = `
    SELECT p.*, u.Username, u.FirstName, u.LastName, ulp.LikedAt
    FROM user_likes_playlist ulp
    JOIN playlist p ON ulp.PlaylistID = p.PlaylistID
    JOIN userprofile u ON p.UserID = u.UserID
    WHERE ulp.UserID = ?
    ORDER BY ulp.LikedAt DESC;
  `;
  
  const rows = pool.prepare(sql).all(userId);
  return rows;
};

export const isSongLiked = async (userId: number, songId: number): Promise<boolean> => {
  const sql = `SELECT 1 FROM user_likes_song WHERE UserID = ? AND SongID = ?`;
  const rows = pool.prepare(sql).all(userId, songId);
  return (rows as any[]).length > 0;
};

export const isAlbumLiked = async (userId: number, albumId: number): Promise<boolean> => {
  const sql = `SELECT 1 FROM user_likes_album WHERE UserID = ? AND AlbumID = ?`;
  const rows = pool.prepare(sql).all(userId, albumId);
  return (rows as any[]).length > 0;
};

export const isPlaylistLiked = async (userId: number, playlistId: number): Promise<boolean> => {
  const sql = `SELECT 1 FROM user_likes_playlist WHERE UserID = ? AND PlaylistID = ?`;
  const rows = pool.prepare(sql).all(userId, playlistId);
  return (rows as any[]).length > 0;
};

export const getSongLikeCount = async (songId: number): Promise<number> => {
  const sql = `SELECT COUNT(*) as count FROM user_likes_song WHERE SongID = ?`;
  const rows = pool.prepare(sql).all(songId);
  return (rows as any[])[0].count;
};

export const getAlbumLikeCount = async (albumId: number): Promise<number> => {
  const sql = `SELECT COUNT(*) as count FROM user_likes_album WHERE AlbumID = ?`;
  const rows = pool.prepare(sql).all(albumId);
  return (rows as any[])[0].count;
};

export const getPlaylistLikeCount = async (playlistId: number): Promise<number> => {
  const sql = `SELECT COUNT(*) as count FROM user_likes_playlist WHERE PlaylistID = ?`;
  const rows = pool.prepare(sql).all(playlistId);
  return (rows as any[])[0].count;
};

