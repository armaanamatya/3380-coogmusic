import { Pool } from 'mysql2/promise';
import * as loginModel from '../models/loginModel.js';
import { ExtendedRequest, ServerResponse } from '../types/index.js';

// Get active login for current user
export async function getActiveLogin(
  pool: Pool,
  req: ExtendedRequest,
  res: ServerResponse
): Promise<void> {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    const login = await loginModel.getActiveLogin(pool, userId);
    
    if (!login) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No active login session found' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(login));
  } catch (error: any) {
    console.error('Error getting active login:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

// Update login activity (increment counters)
export async function updateLoginActivity(
  pool: Pool,
  req: ExtendedRequest,
  res: ServerResponse
): Promise<void> {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    const body = req.body || {};
    const { songsPlayed, songsLiked, artistsFollowed, songsUploaded } = body;

    // Get active login
    const activeLogin = await loginModel.getActiveLogin(pool, userId);
    if (!activeLogin) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No active login session found' }));
      return;
    }

    // Update activity
    await loginModel.updateLoginActivity(pool, activeLogin.LoginID, {
      songsPlayed,
      songsLiked,
      artistsFollowed,
      songsUploaded
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Login activity updated successfully' }));
  } catch (error: any) {
    console.error('Error updating login activity:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

// Logout - update logout date
export async function logoutLoginSession(
  pool: Pool,
  req: ExtendedRequest,
  res: ServerResponse
): Promise<void> {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    // Get active login
    const activeLogin = await loginModel.getActiveLogin(pool, userId);
    if (!activeLogin) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No active login session found' }));
      return;
    }

    // Logout
    await loginModel.logoutLogin(pool, activeLogin.LoginID);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Logout recorded successfully' }));
  } catch (error: any) {
    console.error('Error logging out session:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

