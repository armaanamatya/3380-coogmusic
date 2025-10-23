import { Request, Response } from 'express';
import {
  addListeningHistory,
  getUserListeningHistory,
  getSongListeningHistory,
  getRecentListeningHistory,
  getUserMostPlayedSongs,
  getUserMostPlayedArtists,
  getGlobalMostPlayedSongs,
  deleteUserListeningHistory,
  deleteSongListeningHistory,
  getListeningStats
} from '../models/historyModel';

// Add listening history entry
export const addListeningHistoryEntry = async (req: Request, res: Response) => {
  try {
    const historyData = req.body;
    const result = await addListeningHistory(historyData);
    res.status(201).json({
      success: true,
      message: 'Listening history added successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get user's listening history
export const getUserListeningHistoryList = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;
    const history = await getUserListeningHistory(
      parseInt(userId), 
      limit ? parseInt(limit as string) : undefined
    );
    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get song's listening history
export const getSongListeningHistoryList = async (req: Request, res: Response) => {
  try {
    const { songId } = req.params;
    const { limit } = req.query;
    const history = await getSongListeningHistory(
      parseInt(songId), 
      limit ? parseInt(limit as string) : undefined
    );
    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get recent listening history
export const getRecentListeningHistoryList = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { hours, limit } = req.query;
    const history = await getRecentListeningHistory(
      parseInt(userId), 
      hours ? parseInt(hours as string) : 24,
      limit ? parseInt(limit as string) : undefined
    );
    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user's most played songs
export const getUserMostPlayedSongsList = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;
    const songs = await getUserMostPlayedSongs(
      parseInt(userId), 
      limit ? parseInt(limit as string) : 10
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

// Get user's most played artists
export const getUserMostPlayedArtistsList = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;
    const artists = await getUserMostPlayedArtists(
      parseInt(userId), 
      limit ? parseInt(limit as string) : 10
    );
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

// Get global most played songs
export const getGlobalMostPlayedSongsList = async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const songs = await getGlobalMostPlayedSongs(
      limit ? parseInt(limit as string) : 10
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

// Delete user's listening history
export const deleteUserListeningHistoryAction = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await deleteUserListeningHistory(parseInt(userId));
    res.json({
      success: true,
      message: 'User listening history deleted successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete song's listening history
export const deleteSongListeningHistoryAction = async (req: Request, res: Response) => {
  try {
    const { songId } = req.params;
    const result = await deleteSongListeningHistory(parseInt(songId));
    res.json({
      success: true,
      message: 'Song listening history deleted successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get user's listening statistics
export const getUserListeningStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const stats = await getListeningStats(parseInt(userId));
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
