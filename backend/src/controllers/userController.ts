import { Request, Response } from 'express';
import {
  insertUser,
  getUserById,
  getUserByUsername as getUserByUsernameModel,
  getAllUsers,
  updateUser,
  updateType,
  updateOnlineStatus,
  activateUser,
  deactivateUser,
  banUser,
  deleteUser,
  validateUserInput
} from '../models/userModel';

// Create a new user
export const createUser = async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    const result = await insertUser(userData);
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get user by ID
export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await getUserById(parseInt(id));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user by username
export const getUserByUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const user = await getUserByUsernameModel(username);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.json({
      success: true,
      data: users
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update user
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const result = await updateUser(parseInt(id), updates);
    res.json({
      success: true,
      message: 'User updated successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update user type
export const changeUserType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userType } = req.body;
    
    const result = await updateType(parseInt(id), userType);
    res.json({
      success: true,
      message: 'User type updated successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update online status
export const setOnlineStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isOnline } = req.body;
    
    const result = await updateOnlineStatus(parseInt(id), isOnline);
    res.json({
      success: true,
      message: 'Online status updated successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Activate user
export const activateUserAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await activateUser(parseInt(id));
    res.json({
      success: true,
      message: 'User activated successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Deactivate user
export const deactivateUserAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await deactivateUser(parseInt(id));
    res.json({
      success: true,
      message: 'User deactivated successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Ban user
export const banUserAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await banUser(parseInt(id));
    res.json({
      success: true,
      message: 'User banned successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete user
export const removeUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await deleteUser(parseInt(id));
    res.json({
      success: true,
      message: 'User deleted successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
