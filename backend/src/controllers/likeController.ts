import { Request, Response } from 'express';
import {
  likeSong,
  unlikeSong,
  likeAlbum,
  unlikeAlbum,
  likePlaylist,
  unlikePlaylist,
  getUserLikedSongs,
  getUserLikedAlbums,
  getUserLikedPlaylists,
  isSongLiked,
  isAlbumLiked,
  isPlaylistLiked,
  getSongLikeCount,
  getAlbumLikeCount,
  getPlaylistLikeCount
} from '../models/likeModel';

// Like a song
export const likeSongAction = async (req: Request, res: Response) => {
  try {
    const { userId, songId } = req.params;
    const result = await likeSong(parseInt(userId), parseInt(songId));
    res.json({
      success: true,
      message: 'Song liked successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Unlike a song
export const unlikeSongAction = async (req: Request, res: Response) => {
  try {
    const { userId, songId } = req.params;
    const result = await unlikeSong(parseInt(userId), parseInt(songId));
    res.json({
      success: true,
      message: 'Song unliked successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Like an album
export const likeAlbumAction = async (req: Request, res: Response) => {
  try {
    const { userId, albumId } = req.params;
    const result = await likeAlbum(parseInt(userId), parseInt(albumId));
    res.json({
      success: true,
      message: 'Album liked successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Unlike an album
export const unlikeAlbumAction = async (req: Request, res: Response) => {
  try {
    const { userId, albumId } = req.params;
    const result = await unlikeAlbum(parseInt(userId), parseInt(albumId));
    res.json({
      success: true,
      message: 'Album unliked successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Like a playlist
export const likePlaylistAction = async (req: Request, res: Response) => {
  try {
    const { userId, playlistId } = req.params;
    const result = await likePlaylist(parseInt(userId), parseInt(playlistId));
    res.json({
      success: true,
      message: 'Playlist liked successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Unlike a playlist
export const unlikePlaylistAction = async (req: Request, res: Response) => {
  try {
    const { userId, playlistId } = req.params;
    const result = await unlikePlaylist(parseInt(userId), parseInt(playlistId));
    res.json({
      success: true,
      message: 'Playlist unliked successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get user's liked songs
export const getUserLikedSongsList = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const songs = await getUserLikedSongs(parseInt(userId));
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

// Get user's liked albums
export const getUserLikedAlbumsList = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const albums = await getUserLikedAlbums(parseInt(userId));
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

// Get user's liked playlists
export const getUserLikedPlaylistsList = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const playlists = await getUserLikedPlaylists(parseInt(userId));
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

// Check if song is liked
export const checkSongLiked = async (req: Request, res: Response) => {
  try {
    const { userId, songId } = req.params;
    const isLiked = await isSongLiked(parseInt(userId), parseInt(songId));
    res.json({
      success: true,
      data: { isLiked }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Check if album is liked
export const checkAlbumLiked = async (req: Request, res: Response) => {
  try {
    const { userId, albumId } = req.params;
    const isLiked = await isAlbumLiked(parseInt(userId), parseInt(albumId));
    res.json({
      success: true,
      data: { isLiked }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Check if playlist is liked
export const checkPlaylistLiked = async (req: Request, res: Response) => {
  try {
    const { userId, playlistId } = req.params;
    const isLiked = await isPlaylistLiked(parseInt(userId), parseInt(playlistId));
    res.json({
      success: true,
      data: { isLiked }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get song like count
export const getSongLikeCountAction = async (req: Request, res: Response) => {
  try {
    const { songId } = req.params;
    const count = await getSongLikeCount(parseInt(songId));
    res.json({
      success: true,
      data: { count }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get album like count
export const getAlbumLikeCountAction = async (req: Request, res: Response) => {
  try {
    const { albumId } = req.params;
    const count = await getAlbumLikeCount(parseInt(albumId));
    res.json({
      success: true,
      data: { count }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get playlist like count
export const getPlaylistLikeCountAction = async (req: Request, res: Response) => {
  try {
    const { playlistId } = req.params;
    const count = await getPlaylistLikeCount(parseInt(playlistId));
    res.json({
      success: true,
      data: { count }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
