import { Request, Response } from 'express';
import {
  createPlaylist,
  getPlaylistById,
  getPlaylistsByUser,
  getPublicPlaylists,
  updatePlaylist,
  deletePlaylist,
  searchPlaylists,
  addSongToPlaylist,
  removeSongFromPlaylist,
  getPlaylistSongs,
  reorderPlaylistSongs,
  getPlaylistWithSongs
} from '../models/playlistModel';

// Create a new playlist
export const createNewPlaylist = async (req: Request, res: Response) => {
  try {
    const playlistData = req.body;
    const result = await createPlaylist(playlistData);
    res.status(201).json({
      success: true,
      message: 'Playlist created successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get playlist by ID
export const getPlaylist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const playlist = await getPlaylistById(parseInt(id));
    
    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }
    
    res.json({
      success: true,
      data: playlist
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get playlists by user
export const getUserPlaylists = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const playlists = await getPlaylistsByUser(parseInt(userId));
    res.json({
      success: true,
      data: playlists
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get public playlists
export const getPublicPlaylistsList = async (req: Request, res: Response) => {
  try {
    const { limit, offset } = req.query;
    const playlists = await getPublicPlaylists(
      limit ? parseInt(limit as string) : undefined,
      offset ? parseInt(offset as string) : undefined
    );
    res.json({
      success: true,
      data: playlists
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update playlist
export const updatePlaylistDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const result = await updatePlaylist(parseInt(id), updates);
    res.json({
      success: true,
      message: 'Playlist updated successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete playlist
export const removePlaylist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await deletePlaylist(parseInt(id));
    res.json({
      success: true,
      message: 'Playlist deleted successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Search playlists
export const searchPlaylistsByName = async (req: Request, res: Response) => {
  try {
    const { query, includePrivate } = req.query;
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const playlists = await searchPlaylists(
      query as string, 
      includePrivate === 'true'
    );
    res.json({
      success: true,
      data: playlists
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add song to playlist
export const addSongToPlaylistAction = async (req: Request, res: Response) => {
  try {
    const { playlistId, songId } = req.params;
    const { position } = req.body;
    
    const result = await addSongToPlaylist(
      parseInt(playlistId), 
      parseInt(songId), 
      position
    );
    res.json({
      success: true,
      message: 'Song added to playlist successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Remove song from playlist
export const removeSongFromPlaylistAction = async (req: Request, res: Response) => {
  try {
    const { playlistId, songId } = req.params;
    const result = await removeSongFromPlaylist(
      parseInt(playlistId), 
      parseInt(songId)
    );
    res.json({
      success: true,
      message: 'Song removed from playlist successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get playlist songs
export const getPlaylistSongsList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const songs = await getPlaylistSongs(parseInt(id));
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

// Reorder playlist songs
export const reorderPlaylistSongsAction = async (req: Request, res: Response) => {
  try {
    const { playlistId, songId } = req.params;
    const { newPosition } = req.body;
    
    const result = await reorderPlaylistSongs(
      parseInt(playlistId), 
      parseInt(songId), 
      newPosition
    );
    res.json({
      success: true,
      message: 'Playlist songs reordered successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get playlist with songs
export const getPlaylistWithSongsList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const playlist = await getPlaylistWithSongs(parseInt(id));
    
    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }
    
    res.json({
      success: true,
      data: playlist
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
