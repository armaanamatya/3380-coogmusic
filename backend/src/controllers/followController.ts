import { Request, Response } from 'express';
import {
  followArtist,
  unfollowArtist,
  getUserFollowing,
  getArtistFollowers,
  isFollowingArtist,
  getFollowerCount,
  getFollowingCount,
  getMutualFollows
} from '../models/followModel';

// Follow an artist
export const followArtistAction = async (req: Request, res: Response) => {
  try {
    const { userId, artistId } = req.params;
    const result = await followArtist(parseInt(userId), parseInt(artistId));
    res.json({
      success: true,
      message: 'Artist followed successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Unfollow an artist
export const unfollowArtistAction = async (req: Request, res: Response) => {
  try {
    const { userId, artistId } = req.params;
    const result = await unfollowArtist(parseInt(userId), parseInt(artistId));
    res.json({
      success: true,
      message: 'Artist unfollowed successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get user's following list
export const getUserFollowingList = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const following = await getUserFollowing(parseInt(userId));
    res.json({
      success: true,
      data: following
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get artist's followers
export const getArtistFollowersList = async (req: Request, res: Response) => {
  try {
    const { artistId } = req.params;
    const followers = await getArtistFollowers(parseInt(artistId));
    res.json({
      success: true,
      data: followers
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Check if user is following artist
export const checkFollowingArtist = async (req: Request, res: Response) => {
  try {
    const { userId, artistId } = req.params;
    const isFollowing = await isFollowingArtist(parseInt(userId), parseInt(artistId));
    res.json({
      success: true,
      data: { isFollowing }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get artist follower count
export const getArtistFollowerCount = async (req: Request, res: Response) => {
  try {
    const { artistId } = req.params;
    const count = await getFollowerCount(parseInt(artistId));
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

// Get user following count
export const getUserFollowingCount = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const count = await getFollowingCount(parseInt(userId));
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

// Get mutual follows between two users
export const getMutualFollowsList = async (req: Request, res: Response) => {
  try {
    const { userId1, userId2 } = req.params;
    const mutualFollows = await getMutualFollows(parseInt(userId1), parseInt(userId2));
    res.json({
      success: true,
      data: mutualFollows
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
