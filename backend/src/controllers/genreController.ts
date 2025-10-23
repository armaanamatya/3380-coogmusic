import { Request, Response } from 'express';
import {
  createGenre,
  getGenreById,
  getGenreByName,
  getAllGenres,
  updateGenre,
  deleteGenre,
  searchGenres,
  getGenresWithSongCount,
  getSongsByGenre
} from '../models/genreModel';

// Create a new genre
export const createNewGenre = async (req: Request, res: Response) => {
  try {
    const genreData = req.body;
    const result = await createGenre(genreData);
    res.status(201).json({
      success: true,
      message: 'Genre created successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get genre by ID
export const getGenre = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const genre = await getGenreById(parseInt(id));
    
    if (!genre) {
      return res.status(404).json({
        success: false,
        message: 'Genre not found'
      });
    }
    
    res.json({
      success: true,
      data: genre
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get genre by name
export const getGenreByName = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const genre = await getGenreByName(name);
    
    if (!genre) {
      return res.status(404).json({
        success: false,
        message: 'Genre not found'
      });
    }
    
    res.json({
      success: true,
      data: genre
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all genres
export const getGenres = async (req: Request, res: Response) => {
  try {
    const genres = await getAllGenres();
    res.json({
      success: true,
      data: genres
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update genre
export const updateGenreDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const result = await updateGenre(parseInt(id), updates);
    res.json({
      success: true,
      message: 'Genre updated successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete genre
export const removeGenre = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await deleteGenre(parseInt(id));
    res.json({
      success: true,
      message: 'Genre deleted successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Search genres
export const searchGenresByName = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const genres = await searchGenres(query as string);
    res.json({
      success: true,
      data: genres
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get genres with song count
export const getGenresWithCounts = async (req: Request, res: Response) => {
  try {
    const genres = await getGenresWithSongCount();
    res.json({
      success: true,
      data: genres
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
