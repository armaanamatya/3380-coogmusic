import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { initializeDatabase, testConnection, createConnection } from './database.js';
import * as authController from './controllers/authController.js';
import * as songController from './controllers/songController.js';
import * as albumController from './controllers/albumController.js';
import * as artistController from './controllers/artistController.js';
import * as genreController from './controllers/genreController.js';
import * as playlistController from './controllers/playlistController.js';
import * as userController from './controllers/userController.js';
import * as likeController from './controllers/likeController.js';
import * as followController from './controllers/followController.js';
import * as historyController from './controllers/historyController.js';
import { RegisterUserData, LoginCredentials, UploadMusicData, CreateAlbumData } from './types/index.js';

dotenv.config();

const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profile-pictures';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadProfilePicture = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Configure multer for music file uploads
const musicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir;
    if (file.fieldname === 'audioFile') {
      uploadDir = 'uploads/music';
    } else if (file.fieldname === 'albumCover') {
      uploadDir = 'uploads/album-covers';
    } else {
      uploadDir = 'uploads/misc';
    }
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadMusic = multer({
  storage: musicStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for audio files
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audioFile') {
      // Accept audio files
      if (file.mimetype.startsWith('audio/') || 
          ['.mp3', '.wav', '.flac', '.m4a', '.aac'].includes(path.extname(file.originalname).toLowerCase())) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed'));
      }
    } else if (file.fieldname === 'albumCover') {
      // Accept image files for album covers
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for album covers'));
      }
    } else {
      cb(null, true);
    }
  }
});

// Request logging helper
function logRequest(method: string, path: string, query?: any) {
  const timestamp = new Date().toISOString();
  const queryString = query && Object.keys(query).length > 0 ? JSON.stringify(query) : '';
  console.log(`\n[${timestamp}] ${method} ${path}${queryString ? ' Query: ' + queryString : ''}`);
}

function logResponse(status: number, message: string) {
  console.log(`  Response: ${status} - ${message}`);
}

function logError(error: any) {
  console.error(`  ❌ Error:`, error.message || error);
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const parsedUrl = parse(req.url || '', true);
  const requestPath = parsedUrl.pathname;
  const method = req.method;
  const startTime = Date.now();

  // Log incoming request
  if (requestPath !== '/api/health' && !requestPath?.startsWith('/uploads/')) {
    logRequest(method || 'UNKNOWN', requestPath || '/', parsedUrl.query);
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Add response logging wrapper
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: any, callback?: any): any {
    const duration = Date.now() - startTime;
    if (requestPath !== '/api/health' && !requestPath?.startsWith('/uploads/')) {
      console.log(`  ⏱️  Duration: ${duration}ms\n`);
    }
    return originalEnd(chunk, encoding, callback);
  } as any;

  if (requestPath === '/api/health' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', message: 'Server is running' }));
    return;
  }

  // Serve uploaded files (profile pictures, music, album covers)
  if (requestPath?.startsWith('/uploads/') && method === 'GET') {
    const filePath = path.join(process.cwd(), requestPath);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const contentTypeMap: Record<string, string> = {
        // Image types
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        // Audio types
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.flac': 'audio/flac',
        '.m4a': 'audio/mp4',
        '.aac': 'audio/aac'
      };
      const contentType = contentTypeMap[ext] || 'application/octet-stream';

      // Add cache headers for better performance
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'File not found' }));
    }
    return;
  }

  if (requestPath === '/api/test' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Hello from Node.js TypeScript backend!' }));
    return;
  }

  // Test database connection
  if (requestPath === '/api/test-db' && method === 'GET') {
    try {
      const db = await createConnection();
      const songCount = db.prepare("SELECT COUNT(*) as count FROM song").get() as { count: number };
      const albumCount = db.prepare("SELECT COUNT(*) as count FROM album").get() as { count: number };
      const artistCount = db.prepare("SELECT COUNT(*) as count FROM artist").get() as { count: number };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Database connection successful',
        counts: {
          songs: songCount.count,
          albums: albumCount.count,
          artists: artistCount.count
        }
      }));
    } catch (error: any) {
      console.error('Database test error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Database test failed', details: error.message }));
    }
    return;
  }

  // User Registration Endpoint
  if (requestPath === '/api/auth/register' && method === 'POST') {
    console.log('  📝 Processing registration request...');
    try {
      // Use multer to handle multipart/form-data
      uploadProfilePicture.single('profilePicture')(req as any, res as any, async (err: any) => {
        if (err) {
          logError(err);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
          return;
        }

        try {
          const userData = (req as any).body as RegisterUserData;
          const profilePicture = (req as any).file;
          console.log(`  👤 User: ${userData.username} (${userData.email})`);
          console.log(`  📷 Profile Picture: ${profilePicture ? profilePicture.filename : 'None'}`);
          
          const db = await createConnection();

          // Prepare profile picture path
          const profilePicturePath = profilePicture ? `/uploads/profile-pictures/${profilePicture.filename}` : null;

          // Register user using controller
          const result = await authController.registerUser(db, userData, profilePicturePath);

          console.log(`  ✅ User registered successfully (ID: ${result.userId})`);
          logResponse(201, 'User registered successfully');
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            message: 'User registered successfully', 
            userId: result.userId 
          }));
        } catch (error: any) {
          logError(error);
          const statusCode = error.message.includes('already exists') ? 400 : 500;
          res.writeHead(statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
        }
      });
    } catch (error) {
      logError(error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    
    return;
  }

  // User Login Endpoint
  if (requestPath === '/api/auth/login' && method === 'POST') {
    console.log('  🔐 Processing login request...');
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const credentials = JSON.parse(body) as LoginCredentials;
        console.log(`  👤 User: ${credentials.username}`);
        const db = await createConnection();

        // Authenticate user using controller
        const userData = await authController.authenticateUser(db, credentials);

        console.log(`  ✅ Login successful (ID: ${userData.userId}, Type: ${userData.userType})`);
        logResponse(200, 'Login successful');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Login successful',
          ...userData
        }));
      } catch (error: any) {
        logError(error);
        const statusCode = error.message.includes('Invalid') ? 401 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    
    return;
  }

  // Get all music/songs
  if (requestPath === '/api/song' && method === 'GET') {
    console.log('  🎵 Fetching songs...');
    try {
      const db = await createConnection();
      const { page = '1', limit = '50', artistId, genreId, albumId } = parsedUrl.query;
      
      const filters: {
        page: number;
        limit: number;
        artistId?: number;
        genreId?: number;
        albumId?: number;
      } = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };
      
      if (artistId) {
        filters.artistId = parseInt(artistId as string);
        console.log(`  🎤 Filter by Artist ID: ${artistId}`);
      }
      if (genreId) {
        filters.genreId = parseInt(genreId as string);
        console.log(`  🎸 Filter by Genre ID: ${genreId}`);
      }
      if (albumId) {
        filters.albumId = parseInt(albumId as string);
        console.log(`  💿 Filter by Album ID: ${albumId}`);
      }
      
      const songs = songController.getAllSongs(db, filters);
      console.log(`  ✅ Found ${songs.length} songs`);
      logResponse(200, `Returned ${songs.length} songs`);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ songs }));
    } catch (error) {
      logError(error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Get specific song
  if (requestPath?.match(/^\/api\/song\/\d+$/) && method === 'GET') {
    const songId = parseInt(requestPath.split('/').pop() || '0');
    console.log(`  🎵 Fetching song ID: ${songId}`);
    try {
      const db = await createConnection();
      
      const song = songController.getSongById(db, songId);
      
      if (!song) {
        console.log(`  ❌ Song not found`);
        logResponse(404, 'Song not found');
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Song not found' }));
        return;
      }
      
      console.log(`  ✅ Found: ${(song as any).SongName}`);
      logResponse(200, 'Song retrieved');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ song }));
    } catch (error) {
      logError(error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Update song
  if (requestPath?.match(/^\/api\/song\/\d+$/) && method === 'PUT') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const songId = parseInt(requestPath.split('/').pop() || '0');
        const updateData = JSON.parse(body);
        const db = await createConnection();

        songController.updateSong(db, songId, updateData);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Song updated successfully' }));
      } catch (error: any) {
        console.error('Update song error:', error);
        const statusCode = error.message.includes('not found') ? 404 : 
                          error.message.includes('No valid fields') ? 400 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Delete song
  if (requestPath?.match(/^\/api\/song\/\d+$/) && method === 'DELETE') {
    try {
      const songId = parseInt(requestPath.split('/').pop() || '0');
      const db = await createConnection();

      const result = songController.deleteSong(db, songId);

      // Delete the audio file from disk
      if (result.filePath) {
        songController.deleteFileFromDisk(result.filePath);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Song deleted successfully' }));
    } catch (error: any) {
      console.error('Delete song error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Get all genres
  if (requestPath === '/api/genres' && method === 'GET') {
    try {
      const db = await createConnection();
      const genres = genreController.getAllGenres(db);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ genres }));
    } catch (error) {
      console.error('Get genres error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Get all albums
  if (requestPath === '/api/albums' && method === 'GET') {
    try {
      const db = await createConnection();
      const { artistId } = parsedUrl.query;
      
      const filters: { artistId?: number } = {};
      if (artistId) {
        filters.artistId = parseInt(artistId as string);
      }
      
      const albums = albumController.getAllAlbums(db, filters);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ albums }));
    } catch (error) {
      console.error('Get albums error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Create new album
  if (requestPath === '/api/albums' && method === 'POST') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const albumData = JSON.parse(body) as CreateAlbumData;
        const db = await createConnection();

        const result = albumController.createAlbum(db, albumData);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Album created successfully', 
          albumId: result.albumId 
        }));
      } catch (error: any) {
        console.error('Create album error:', error);
        const statusCode = error.message.includes('not found') ? 400 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Update album
  if (requestPath?.match(/^\/api\/albums\/\d+$/) && method === 'PUT') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const albumId = parseInt(requestPath.split('/').pop() || '0');
        const updateData = JSON.parse(body);
        const db = await createConnection();

        albumController.updateAlbum(db, albumId, updateData);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Album updated successfully' }));
      } catch (error: any) {
        console.error('Update album error:', error);
        const statusCode = error.message.includes('not found') ? 404 : 
                          error.message.includes('No valid fields') ? 400 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Delete album
  if (requestPath?.match(/^\/api\/albums\/\d+$/) && method === 'DELETE') {
    try {
      const albumId = parseInt(requestPath.split('/').pop() || '0');
      const db = await createConnection();

      const result = albumController.deleteAlbum(db, albumId);

      // Delete album cover file if exists
      if (result.albumArtPath) {
        albumController.deleteFileFromDisk(result.albumArtPath);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Album deleted successfully' }));
    } catch (error: any) {
      console.error('Delete album error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('Cannot delete') ? 400 : 500;
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Get all artists
  if (requestPath === '/api/artists' && method === 'GET') {
    try {
      const db = await createConnection();
      const artists = artistController.getAllArtists(db);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ artists }));
    } catch (error) {
      console.error('Get artists error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Music Upload Endpoint
  if (requestPath === '/api/song/upload' && method === 'POST') {
    console.log('  🎵 Processing music upload...');
    try {
      uploadMusic.fields([
        { name: 'audioFile', maxCount: 1 },
        { name: 'albumCover', maxCount: 1 }
      ])(req as any, res as any, async (err: any) => {
        if (err) {
          logError(err);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
          return;
        }

        try {
          const musicData = (req as any).body as UploadMusicData;
          const files = (req as any).files;
          const audioFile = files?.audioFile?.[0];
          const albumCover = files?.albumCover?.[0];

          console.log(`  🎵 Song: ${musicData.songName}`);
          console.log(`  📁 Audio File: ${audioFile ? audioFile.filename + ' (' + (audioFile.size / 1024 / 1024).toFixed(2) + ' MB)' : 'Missing'}`);
          console.log(`  🖼️  Album Cover: ${albumCover ? albumCover.filename : 'None'}`);

          if (!audioFile) {
            console.log(`  ❌ Audio file is required`);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Audio file is required' }));
            return;
          }

          const db = await createConnection();

          // Prepare file paths
          const audioFilePath = `/uploads/music/${audioFile.filename}`;
          const albumCoverPath = albumCover ? `/uploads/album-covers/${albumCover.filename}` : null;

          // Create song using controller
          const result = songController.createSong(db, musicData, audioFilePath, audioFile.size);
          console.log(`  ✅ Song created (ID: ${result.songId})`);

          // If album cover provided and albumId exists, update album cover
          if (albumCover && musicData.albumId && albumCoverPath) {
            albumController.updateAlbumCover(db, musicData.albumId, albumCoverPath);
            console.log(`  🖼️  Album cover updated for Album ID: ${musicData.albumId}`);
          }

          logResponse(201, 'Music uploaded successfully');
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            message: 'Music uploaded successfully', 
            songId: result.songId,
            audioFilePath: result.audioFilePath,
            albumCoverPath
          }));
        } catch (error: any) {
          logError(error);
          const statusCode = error.message.includes('not found') ? 400 : 500;
          res.writeHead(statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
        }
      });
    } catch (error) {
      logError(error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // ==================== USER ROUTES ====================
  
  // Get user by ID
  if (requestPath?.match(/^\/api\/users\/\d+$/) && method === 'GET') {
    const userId = parseInt(requestPath.split('/').pop() || '0');
    try {
      const db = await createConnection();
      const user = userController.getUserById(db, userId);
      
      if (!user) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not found' }));
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ user }));
    } catch (error: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Update user
  if (requestPath?.match(/^\/api\/users\/\d+$/) && method === 'PUT') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const userId = parseInt(requestPath.split('/').pop() || '0');
        const updateData = JSON.parse(body);
        const db = await createConnection();
        
        userController.updateUser(db, userId, updateData);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User updated successfully' }));
      } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Search users
  if (requestPath === '/api/users/search' && method === 'GET') {
    try {
      const { query, page, limit } = parsedUrl.query;
      const db = await createConnection();
      const filters: { page?: number; limit?: number } = {};
      if (page) filters.page = parseInt(page as string);
      if (limit) filters.limit = parseInt(limit as string);
      const users = userController.searchUsers(db, query as string || '', filters);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ users }));
    } catch (error: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // ==================== PLAYLIST ROUTES ====================
  
  // Get all playlists or public playlists
  if (requestPath === '/api/playlists' && method === 'GET') {
    try {
      const { userId, page = '1', limit = '50' } = parsedUrl.query;
      const db = await createConnection();
      
      let playlists;
      if (userId) {
        playlists = playlistController.getPlaylistsByUser(db, parseInt(userId as string));
      } else {
        playlists = playlistController.getPublicPlaylists(db, {
          page: parseInt(page as string),
          limit: parseInt(limit as string)
        });
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ playlists }));
    } catch (error: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Create new playlist
  if (requestPath === '/api/playlists' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const playlistData = JSON.parse(body);
        const db = await createConnection();
        
        const result = playlistController.createPlaylist(db, playlistData);
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Playlist created successfully', 
          playlistId: result.playlistId 
        }));
      } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 400 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Get playlist by ID
  if (requestPath?.match(/^\/api\/playlists\/\d+$/) && method === 'GET') {
    const playlistId = parseInt(requestPath.split('/').pop() || '0');
    try {
      const db = await createConnection();
      const playlist = playlistController.getPlaylistById(db, playlistId);
      
      if (!playlist) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Playlist not found' }));
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ playlist }));
    } catch (error: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Update playlist
  if (requestPath?.match(/^\/api\/playlists\/\d+$/) && method === 'PUT') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const playlistId = parseInt(requestPath.split('/').pop() || '0');
        const updateData = JSON.parse(body);
        const db = await createConnection();
        
        playlistController.updatePlaylist(db, playlistId, updateData);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Playlist updated successfully' }));
      } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Delete playlist
  if (requestPath?.match(/^\/api\/playlists\/\d+$/) && method === 'DELETE') {
    try {
      const playlistId = parseInt(requestPath.split('/').pop() || '0');
      const db = await createConnection();
      
      playlistController.deletePlaylist(db, playlistId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Playlist deleted successfully' }));
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Get playlist songs
  if (requestPath?.match(/^\/api\/playlists\/\d+\/songs$/) && method === 'GET') {
    const playlistId = parseInt(requestPath.split('/')[3]!);
    try {
      const db = await createConnection();
      const songs = playlistController.getPlaylistSongs(db, playlistId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ songs }));
    } catch (error: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Add song to playlist
  if (requestPath?.match(/^\/api\/playlists\/\d+\/songs$/) && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const playlistId = parseInt(requestPath.split('/')[3]!);
        const { songId } = JSON.parse(body);
        const db = await createConnection();
        
        playlistController.addSongToPlaylist(db, playlistId, songId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Song added to playlist' }));
      } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 : 
                          error.message.includes('already exists') ? 400 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Remove song from playlist
  if (requestPath?.match(/^\/api\/playlists\/\d+\/songs\/\d+$/) && method === 'DELETE') {
    try {
      const parts = requestPath.split('/');
      const playlistId = parseInt(parts[3]!);
      const songId = parseInt(parts[5]!);
      const db = await createConnection();
      
      playlistController.removeSongFromPlaylist(db, playlistId, songId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Song removed from playlist' }));
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // ==================== LIKE ROUTES ====================
  
  // Like a song
  if (requestPath === '/api/likes/songs' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { userId, songId } = JSON.parse(body);
        const db = await createConnection();
        
        likeController.likeSong(db, userId, songId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Song liked successfully' }));
      } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 :
                          error.message.includes('already liked') ? 400 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Unlike a song
  if (requestPath === '/api/likes/songs' && method === 'DELETE') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { userId, songId } = JSON.parse(body);
        const db = await createConnection();
        
        likeController.unlikeSong(db, userId, songId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Song unliked successfully' }));
      } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Get user's liked songs
  if (requestPath?.match(/^\/api\/users\/\d+\/liked-songs$/) && method === 'GET') {
    const userId = parseInt(requestPath.split('/')[3]!);
    try {
      const { page = '1', limit = '50' } = parsedUrl.query;
      const db = await createConnection();
      const songs = likeController.getUserLikedSongs(db, userId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ songs }));
    } catch (error: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Like an album
  if (requestPath === '/api/likes/albums' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { userId, albumId } = JSON.parse(body);
        const db = await createConnection();
        
        likeController.likeAlbum(db, userId, albumId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Album liked successfully' }));
      } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 :
                          error.message.includes('already liked') ? 400 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Unlike an album
  if (requestPath === '/api/likes/albums' && method === 'DELETE') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { userId, albumId } = JSON.parse(body);
        const db = await createConnection();
        
        likeController.unlikeAlbum(db, userId, albumId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Album unliked successfully' }));
      } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Like a playlist
  if (requestPath === '/api/likes/playlists' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { userId, playlistId } = JSON.parse(body);
        const db = await createConnection();
        
        likeController.likePlaylist(db, userId, playlistId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Playlist liked successfully' }));
      } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 :
                          error.message.includes('already liked') ? 400 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Unlike a playlist
  if (requestPath === '/api/likes/playlists' && method === 'DELETE') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { userId, playlistId } = JSON.parse(body);
        const db = await createConnection();
        
        likeController.unlikePlaylist(db, userId, playlistId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Playlist unliked successfully' }));
      } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // ==================== FOLLOW ROUTES ====================
  
  // Follow an artist
  if (requestPath === '/api/follows' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { userId, artistId } = JSON.parse(body);
        const db = await createConnection();
        
        followController.followArtist(db, userId, artistId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Artist followed successfully' }));
      } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 :
                          error.message.includes('already following') ? 400 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Unfollow an artist
  if (requestPath === '/api/follows' && method === 'DELETE') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { userId, artistId } = JSON.parse(body);
        const db = await createConnection();
        
        followController.unfollowArtist(db, userId, artistId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Artist unfollowed successfully' }));
      } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Get user's following list
  if (requestPath?.match(/^\/api\/users\/\d+\/following$/) && method === 'GET') {
    const userId = parseInt(requestPath.split('/')[3]!);
    try {
      const { page = '1', limit = '50' } = parsedUrl.query;
      const db = await createConnection();
      const artists = followController.getUserFollowing(db, userId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ artists }));
    } catch (error: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Get artist's followers
  if (requestPath?.match(/^\/api\/artists\/\d+\/followers$/) && method === 'GET') {
    const artistId = parseInt(requestPath.split('/')[3]!);
    try {
      const { page = '1', limit = '50' } = parsedUrl.query;
      const db = await createConnection();
      const followers = followController.getArtistFollowers(db, artistId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ followers }));
    } catch (error: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // ==================== LISTENING HISTORY ROUTES ====================
  
  // Add listening history
  if (requestPath === '/api/history' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const historyData = JSON.parse(body);
        const db = await createConnection();
        
        const result = historyController.addListeningHistory(db, historyData);
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Listening history added', 
          historyId: result.historyId 
        }));
      } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Get user's listening history
  if (requestPath?.match(/^\/api\/users\/\d+\/history$/) && method === 'GET') {
    const userId = parseInt(requestPath.split('/')[3]!);
    try {
      const { page = '1', limit = '50' } = parsedUrl.query;
      const db = await createConnection();
      const history = historyController.getUserListeningHistory(db, userId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ history }));
    } catch (error: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Get trending songs
  if (requestPath === '/api/trending' && method === 'GET') {
    try {
      const { days = '7', limit = '20' } = parsedUrl.query;
      const db = await createConnection();
      const songs = historyController.getTrendingSongs(db, parseInt(days as string), parseInt(limit as string));
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ songs }));
    } catch (error: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('\n🚀 Starting CoogMusic Backend Server...\n');
    
    await initializeDatabase();
    await testConnection();
    
    server.listen(PORT, () => {
      console.log('═'.repeat(60));
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log('═'.repeat(60));
      console.log('\n📋 Available Endpoints:');
      console.log('  🔐 Auth:       POST /api/auth/register, /api/auth/login');
      console.log('  🎵 Songs:      GET|PUT|DELETE /api/song/:id, POST /api/song/upload');
      console.log('  💿 Albums:     GET|POST /api/albums, PUT|DELETE /api/albums/:id');
      console.log('  🎤 Artists:    GET /api/artists');
      console.log('  🎸 Genres:     GET /api/genres');
      console.log('  📁 Files:      GET /uploads/*');
      console.log('  ❤️  Health:     GET /api/health, /api/test, /api/test-db');
      console.log('\n📝 Request logging is enabled');
      console.log('═'.repeat(60));
      console.log('\n⏳ Waiting for requests...\n');
    });
  } catch (error) {
    console.error('\n❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
