import { Request, Response } from 'express';
import {
  createArtistProfile,
  getArtistById,
  getAllArtists,
  updateArtistProfile,
  verifyArtist,
  unverifyArtist,
  deleteArtistProfile,
  getArtistsByVerificationStatus,
  searchArtists
} from '../models/artistModel';

// Create artist profile
export const createArtist = async (req: Request, res: Response) => {
  try {
    const artistData = req.body;
    const result = await createArtistProfile(artistData);
    res.status(201).json({
      success: true,
      message: 'Artist profile created successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get artist by ID
export const getArtist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const artist = await getArtistById(parseInt(id));
    
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
    }
    
    res.json({
      success: true,
      data: artist
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all artists
export const getArtists = async (req: Request, res: Response) => {
  try {
    const { includeUnverified } = req.query;
    const artists = await getAllArtists(includeUnverified === 'true');
    res.json({
      success: true,
      data: artists
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update artist profile
export const updateArtist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const result = await updateArtistProfile(parseInt(id), updates);
    res.json({
      success: true,
      message: 'Artist profile updated successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Verify artist
export const verifyArtistAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;
    
    const result = await verifyArtist(parseInt(id), adminId);
    res.json({
      success: true,
      message: 'Artist verified successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Unverify artist
export const unverifyArtistAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await unverifyArtist(parseInt(id));
    res.json({
      success: true,
      message: 'Artist unverified successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete artist profile
export const removeArtist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await deleteArtistProfile(parseInt(id));
    res.json({
      success: true,
      message: 'Artist profile deleted successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get artists by verification status
export const getArtistsByStatus = async (req: Request, res: Response) => {
  try {
    const { verified } = req.params;
    const artists = await getArtistsByVerificationStatus(verified === 'true');
    res.json({
      success: true,
      data: artists
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Search artists
export const searchArtistsByName = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const artists = await searchArtists(query as string);
    res.json({
      success: true,
      data: artists
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
