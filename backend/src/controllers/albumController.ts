import { Request, Response } from 'express';
import {
  createAlbum,
  getAlbumById,
  getAlbumByName,
  getAlbumsByArtist,
  getAllAlbums,
  updateAlbum,
  deleteAlbum,
  searchAlbums,
  getAlbumWithSongs
} from '../models/albumModel';

// Create a new album
export const createNewAlbum = async (req: Request, res: Response) => {
  try {
    const albumData = req.body;
    const result = await createAlbum(albumData);
    res.status(201).json({
      success: true,
      message: 'Album created successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get album by ID
export const getAlbum = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const album = await getAlbumById(parseInt(id));
    
    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }
    
    res.json({
      success: true,
      data: album
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get album by name
export const getAlbumByName = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const album = await getAlbumByName(name);
    
    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }
    
    res.json({
      success: true,
      data: album
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get albums by artist
export const getArtistAlbums = async (req: Request, res: Response) => {
  try {
    const { artistId } = req.params;
    const albums = await getAlbumsByArtist(parseInt(artistId));
    res.json({
      success: true,
      data: albums
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all albums
export const getAlbums = async (req: Request, res: Response) => {
  try {
    const { limit, offset } = req.query;
    const albums = await getAllAlbums(
      limit ? parseInt(limit as string) : undefined,
      offset ? parseInt(offset as string) : undefined
    );
    res.json({
      success: true,
      data: albums
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update album
export const updateAlbumDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const result = await updateAlbum(parseInt(id), updates);
    res.json({
      success: true,
      message: 'Album updated successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete album
export const removeAlbum = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await deleteAlbum(parseInt(id));
    res.json({
      success: true,
      message: 'Album deleted successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Search albums
export const searchAlbumsByName = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const albums = await searchAlbums(query as string);
    res.json({
      success: true,
      data: albums
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get album with songs
export const getAlbumWithSongsList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const album = await getAlbumWithSongs(parseInt(id));
    
    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }
    
    res.json({
      success: true,
      data: album
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
