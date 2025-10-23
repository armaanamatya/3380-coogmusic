import { Request, Response } from 'express';
import {
  createSong,
  getSongById,
  getSongsByArtist,
  getSongsByAlbum,
  getAllSongs,
  updateSong,
  deleteSong,
  searchSongs,
  getSongWithGenre,
  getSongsByGenre,
  getPopularSongs,
  incrementListenCount
} from '../models/songModel';

// Create a new song
export const createNewSong = async (req: Request, res: Response) => {
  try {
    const songData = req.body;
    const result = await createSong(songData);
    res.status(201).json({
      success: true,
      message: 'Song created successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get song by ID
export const getSong = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const song = await getSongById(parseInt(id));
    
    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Song not found'
      });
    }
    
    res.json({
      success: true,
      data: song
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get songs by artist
export const getArtistSongs = async (req: Request, res: Response) => {
  try {
    const { artistId } = req.params;
    const songs = await getSongsByArtist(parseInt(artistId));
    res.json({
      success: true,
      data: songs
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get songs by album
export const getAlbumSongs = async (req: Request, res: Response) => {
  try {
    const { albumId } = req.params;
    const songs = await getSongsByAlbum(parseInt(albumId));
    res.json({
      success: true,
      data: songs
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all songs
export const getSongs = async (req: Request, res: Response) => {
  try {
    const { limit, offset } = req.query;
    const songs = await getAllSongs(
      limit ? parseInt(limit as string) : undefined,
      offset ? parseInt(offset as string) : undefined
    );
    res.json({
      success: true,
      data: songs
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update song
export const updateSongDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const result = await updateSong(parseInt(id), updates);
    res.json({
      success: true,
      message: 'Song updated successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete song
export const removeSong = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await deleteSong(parseInt(id));
    res.json({
      success: true,
      message: 'Song deleted successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Search songs
export const searchSongsByName = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const songs = await searchSongs(query as string);
    res.json({
      success: true,
      data: songs
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get song with genre details
export const getSongWithGenreInfo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const song = await getSongWithGenre(parseInt(id));
    
    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Song not found'
      });
    }
    
    res.json({
      success: true,
      data: song
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get songs by genre
export const getSongsByGenreId = async (req: Request, res: Response) => {
  try {
    const { genreId } = req.params;
    const songs = await getSongsByGenre(parseInt(genreId));
    res.json({
      success: true,
      data: songs
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get popular songs
export const getPopularSongsList = async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const songs = await getPopularSongs(limit ? parseInt(limit as string) : 10);
    res.json({
      success: true,
      data: songs
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Increment listen count
export const incrementSongListenCount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await incrementListenCount(parseInt(id));
    res.json({
      success: true,
      message: 'Listen count incremented successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
