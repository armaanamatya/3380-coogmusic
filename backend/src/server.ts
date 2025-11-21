import { createServer, IncomingMessage, ServerResponse } from 'http';
import { ExtendedRequest } from './types/index.js';
import { parse } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { RowDataPacket } from 'mysql2/promise';
import { initializeDatabase, testConnection, getPool } from './database.js';
import * as authController from './controllers/authController.js';
import * as songController from './controllers/songController.js';
import * as albumController from './controllers/albumController.js';
import * as artistController from './controllers/artistController.js';
import * as genreController from './controllers/genreController.js';
import * as playlistController from './controllers/playlistController.js';
import * as userController from './controllers/userController.js';
import * as likeController from './controllers/likeController.js';
import * as ratingController from './controllers/ratingController.js';
import * as followController from './controllers/followController.js';
import * as historyController from './controllers/historyController.js';
// import { getAzureStorage } from './services/azureStorage.js'; // Commented out for local storage deployment
import * as analyticsController from './controllers/analyticsController.js';
import { RegisterUserData, LoginCredentials, UploadMusicData, CreateAlbumData } from './types/index.js';

dotenv.config();

const PORT = process.env.PORT || 3001;

// Configure multer for local file storage
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

// Configure multer for music file uploads (local storage)
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

  // CORS configuration - allow specific origins
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000', 
    'https://3380-coogmusic.vercel.app',
    'https://3380-coogmusic-git-main-armaa-amatyas-projects.vercel.app',
    'https://3380-coogmusic-git-extradata-armaa-amatyas-projects.vercel.app',
    'https://three380-coogmusic-1.onrender.com'
  ];

  const origin = req.headers.origin;
  
  // Allow any Vercel deployment URL for this project
  const isVercelOrigin = origin && (
    origin.includes('3380-coogmusic') && origin.includes('.vercel.app')
  );
  
  // Set CORS headers for all requests
  if (origin && (allowedOrigins.includes(origin) || isVercelOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Be more permissive for now to fix the CORS issue
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours

  // Handle preflight OPTIONS requests
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': origin && (allowedOrigins.includes(origin) || isVercelOrigin) ? origin : '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
    });
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
      const pool = await getPool();
      const [songRows] = await pool.query<any[]>("SELECT COUNT(*) as count FROM song");
      const [albumRows] = await pool.query<any[]>("SELECT COUNT(*) as count FROM album");
      const [artistRows] = await pool.query<any[]>("SELECT COUNT(*) as count FROM artist");
      
      const songCount = songRows[0];
      const albumCount = albumRows[0];
      const artistCount = artistRows[0];
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'MySQL database connection successful',
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
          
          // Validate required fields
          if (!userData || !userData.username || !userData.email || !userData.password) {
            throw new Error('Missing required fields: username, email, and password are required');
          }
          
          console.log(`  👤 User: ${userData.username} (${userData.email})`);
          console.log(`  📷 Profile Picture: ${profilePicture ? profilePicture.filename : 'None'}`);
          
          const pool = await getPool();

          // Prepare profile picture path
          const profilePicturePath = profilePicture ? `/uploads/profile-pictures/${profilePicture.filename}` : null;

          // Register user using controller
          const result = await authController.registerUser(pool, userData, profilePicturePath);

          console.log(`  ✅ User registered successfully (ID: ${result.userId})`);
          logResponse(201, 'User registered successfully');
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            message: 'User registered successfully', 
            userId: result.userId 
          }));
        } catch (error: any) {
          logError(error);
          const statusCode = error.message.includes('already exists') || error.message.includes('Missing required') ? 400 : 500;
          console.log(`  Response: ${statusCode} - ${error.message}`);
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
        
        if (!credentials.username || !credentials.password) {
          throw new Error('Username and password are required');
        }
        
        console.log(`  👤 User: ${credentials.username}`);
        
        // Check for hardcoded admin credentials
        if (credentials.username === 'admin' && credentials.password === 'admin') {
          const adminUserData = {
            userId: -1, // Special admin user ID
            username: 'admin',
            userType: 'Administrator',
            firstName: 'Admin',
            lastName: 'User',
            profilePicture: null
          };
          
          console.log(`  ✅ Admin login successful`);
          logResponse(200, 'Admin login successful');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            message: 'Login successful',
            ...adminUserData
          }));
          return;
        }
        
        const pool = await getPool();

        // Authenticate user using controller
        const userData = await authController.authenticateUser(pool, credentials);

        console.log(`  ✅ Login successful (ID: ${userData.userId}, Type: ${userData.userType})`);
        logResponse(200, 'Login successful');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Login successful',
          ...userData
        }));
      } catch (error: any) {
        logError(error);
        const statusCode = error.message.includes('Invalid') || error.message.includes('required') ? 401 : 500;
        console.log(`  Response: ${statusCode} - ${error.message}`);
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    
    return;
  }

  // Analytics Report Endpoint
  if (requestPath === '/api/analytics/report' && method === 'POST') {
    console.log('  📊 Generating analytics report...');
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const pool = await getPool();
        (req as ExtendedRequest).body = JSON.parse(body);
        await analyticsController.getAnalyticsReport(pool, req, res);
      } catch (error: any) {
        logError(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Individual User Analytics Report Endpoint
  if (requestPath === '/api/analytics/individual' && method === 'POST') {
    console.log('  📊 Generating individual user analytics report...');
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const pool = await getPool();
        (req as ExtendedRequest).body = JSON.parse(body);
        await analyticsController.getIndividualUserReport(pool, req, res);
      } catch (error: any) {
        logError(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Get all music/songs
  if (requestPath === '/api/song' && method === 'GET') {
    console.log('  🎵 Fetching songs...');
    try {
      const pool = await getPool();
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
      
      const songs = await songController.getAllSongs(pool, filters);
      console.log(`  ✅ Found ${songs.length} songs`);
      logResponse(200, `Returned ${songs.length} songs`);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ songs }));
    } catch (error: any) {
      logError(error);
      const errorMessage = error?.message || 'Internal server error';
      console.error(`  Full error:`, error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: errorMessage }));
    }
    return;
  }

  // Get top songs by listen count
  if (requestPath === '/api/song/top' && method === 'GET') {
    try {
      const pool = await getPool();
      const songs = await songController.getTopSongsByListenCount(pool, 10);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ songs }));
    } catch (error) {
      console.error('Get top songs error:', error);
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
      const pool = await getPool();
      
      const song = await songController.getSongById(pool, songId);
      
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
        const pool = await getPool();

        await songController.updateSong(pool, songId, updateData);

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
      const pool = await getPool();

      const result = await songController.deleteSong(pool, songId);

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

  // Increment song listen count
  if (requestPath?.match(/^\/api\/song\/(\d+)\/increment-listen-count$/) && method === 'POST') {
    try {
      const songId = parseInt(requestPath.split('/')[3] || '0');
      if (!songId || isNaN(songId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid song ID' }));
        return;
      }

      const pool = await getPool();
      
      // Verify song exists before incrementing
      const [songs] = await pool.execute('SELECT SongID FROM song WHERE SongID = ?', [songId]);
      if ((songs as any[]).length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Song not found' }));
        return;
      }

      // Import incrementListenCount dynamically to avoid circular dependency
      const { incrementListenCount } = await import('./models/songModel.js');
      await incrementListenCount(pool, songId);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Listen count incremented successfully' }));
    } catch (error: any) {
      console.error('Increment listen count error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Get all genres
  if (requestPath === '/api/genres' && method === 'GET') {
    try {
      const pool = await getPool();
      const genres = await genreController.getAllGenres(pool);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ genres }));
    } catch (error) {
      console.error('Get genres error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Get genres with listen counts
  if (requestPath === '/api/genres/with-listens' && method === 'GET') {
    try {
      const pool = await getPool();
      const genres = await genreController.getGenresWithListenCount(pool);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ genres }));
    } catch (error) {
      console.error('Get genres with listen counts error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Get genre by ID with stats
  if (requestPath?.match(/^\/api\/genres\/(\d+)$/) && method === 'GET') {
    try {
      const genreId = parseInt(requestPath.split('/')[3] || '0');
      const pool = await getPool();
      
      const genre = await genreController.getGenreById(pool, genreId);
      if (!genre) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Genre not found' }));
        return;
      }

      const stats = await genreController.getGenreStats(pool, genreId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ genre: { ...genre, ...stats } }));
    } catch (error: any) {
      console.error('Get genre by ID error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // Get songs by genre
  if (requestPath?.match(/^\/api\/genres\/(\d+)\/songs$/) && method === 'GET') {
    try {
      const genreId = parseInt(requestPath.split('/')[3] || '0');
      const pool = await getPool();
      
      const songs = await genreController.getSongsByGenre(pool, genreId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ songs }));
    } catch (error: any) {
      console.error('Get songs by genre error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // Get albums by genre
  if (requestPath?.match(/^\/api\/genres\/(\d+)\/albums$/) && method === 'GET') {
    try {
      const genreId = parseInt(requestPath.split('/')[3] || '0');
      const pool = await getPool();
      
      const albums = await genreController.getAlbumsByGenre(pool, genreId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ albums }));
    } catch (error: any) {
      console.error('Get albums by genre error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // Get all albums
  if (requestPath === '/api/albums' && method === 'GET') {
    try {
      const pool = await getPool();
      const { artistId } = parsedUrl.query;
      
      const filters: { artistId?: number } = {};
      if (artistId) {
        filters.artistId = parseInt(artistId as string);
      }
      
      const albums = await albumController.getAllAlbums(pool, filters);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ albums }));
    } catch (error) {
      console.error('Get albums error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Get top albums by like count
  if (requestPath === '/api/albums/top' && method === 'GET') {
    try {
      const pool = await getPool();
      const albums = await albumController.getTopAlbumsByLikes(pool, 10);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ albums }));
    } catch (error) {
      console.error('Get top albums error:', error);
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
        const pool = await getPool();

        const result = await albumController.createAlbum(pool, albumData);

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
        const pool = await getPool();

        await albumController.updateAlbum(pool, albumId, updateData);

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
      const pool = await getPool();

      const result = await albumController.deleteAlbum(pool, albumId);

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

  // Get album statistics
  if (requestPath?.match(/^\/api\/albums\/\d+\/stats$/) && method === 'GET') {
    try {
      const albumIdStr = requestPath.split('/')[3];
      if (!albumIdStr) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid album ID' }));
        return;
      }
      const albumId = parseInt(albumIdStr);
      if (isNaN(albumId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid album ID' }));
        return;
      }

      const pool = await getPool();
      
      // Get like count
      const [likeRows] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as likeCount FROM user_likes_album WHERE AlbumID = ?',
        [albumId]
      );
      const likeCount = likeRows[0]?.likeCount || 0;

      // Get song count, total plays, and total duration
      const [songRows] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as songCount, COALESCE(SUM(ListenCount), 0) as totalPlays, COALESCE(SUM(Duration), 0) as totalDuration FROM song WHERE AlbumID = ?',
        [albumId]
      );
      const songCount = songRows[0]?.songCount || 0;
      const totalPlays = songRows[0]?.totalPlays || 0;
      const totalDuration = songRows[0]?.totalDuration || 0;

      // Get release date
      const [albumRows] = await pool.execute<RowDataPacket[]>(
        'SELECT ReleaseDate FROM album WHERE AlbumID = ?',
        [albumId]
      );
      const releaseDate = albumRows[0]?.ReleaseDate || null;

      const stats = {
        likeCount,
        songCount,
        totalPlays,
        totalDuration,
        releaseDate
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ stats }));
    } catch (error) {
      console.error('Get album stats error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Get all artists
  if (requestPath === '/api/artists' && method === 'GET') {
    try {
      const pool = await getPool();
      const artists = await artistController.getAllArtists(pool);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ artists }));
    } catch (error) {
      console.error('Get artists error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Get top artists by followers
  if (requestPath === '/api/artists/top' && method === 'GET') {
    try {
      const pool = await getPool();
      const artists = await artistController.getTopArtistsByFollowers(pool, 10);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ artists }));
    } catch (error) {
      console.error('Get top artists error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Get recommended artists
  if (requestPath === '/api/artists/recommended' && method === 'GET') {
    try {
      const pool = await getPool();
      const artists = await artistController.getRecommendedArtists(pool, 10);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ artists }));
    } catch (error) {
      console.error('Get recommended artists error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Get individual artist by ID
  if (requestPath?.match(/^\/api\/artists\/\d+$/) && method === 'GET') {
    console.log(`  🎤 Found artist route match for: ${requestPath}`);
    try {
      const artistIdStr = requestPath.split('/')[3];
      if (!artistIdStr) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid artist ID' }));
        return;
      }
      const artistId = parseInt(artistIdStr);
      if (isNaN(artistId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid artist ID' }));
        return;
      }

      const pool = await getPool();
      const artist = await artistController.getArtistById(pool, artistId);
      
      if (!artist) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Artist not found' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ artist }));
    } catch (error) {
      console.error('Get artist by ID error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Get artist albums
  if (requestPath?.match(/^\/api\/artists\/\d+\/albums$/) && method === 'GET') {
    try {
      const artistIdStr = requestPath.split('/')[3];
      if (!artistIdStr) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid artist ID' }));
        return;
      }
      const artistId = parseInt(artistIdStr);
      if (isNaN(artistId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid artist ID' }));
        return;
      }

      const pool = await getPool();
      const albums = await artistController.getArtistAlbums(pool, artistId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ albums }));
    } catch (error) {
      console.error('Get artist albums error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Get artist songs
  if (requestPath?.match(/^\/api\/artists\/\d+\/songs$/) && method === 'GET') {
    try {
      const artistIdStr = requestPath.split('/')[3];
      if (!artistIdStr) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid artist ID' }));
        return;
      }
      const artistId = parseInt(artistIdStr);
      if (isNaN(artistId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid artist ID' }));
        return;
      }

      const pool = await getPool();
      const songs = await artistController.getArtistSongs(pool, artistId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ songs }));
    } catch (error) {
      console.error('Get artist songs error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Get artist statistics
  if (requestPath?.match(/^\/api\/artists\/\d+\/stats$/) && method === 'GET') {
    try {
      const artistIdStr = requestPath.split('/')[3];
      if (!artistIdStr) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid artist ID' }));
        return;
      }
      const artistId = parseInt(artistIdStr);
      if (isNaN(artistId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid artist ID' }));
        return;
      }

      const pool = await getPool();
      
      // Get follower count
      const [followerRows] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as followerCount FROM user_follows_artist WHERE ArtistID = ?',
        [artistId]
      );
      const followerCount = followerRows[0]?.followerCount || 0;

      // Get album count
      const [albumRows] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as albumCount FROM album WHERE ArtistID = ?',
        [artistId]
      );
      const albumCount = albumRows[0]?.albumCount || 0;

      // Get song count and total listens
      const [songRows] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as songCount, COALESCE(SUM(ListenCount), 0) as totalListens FROM song WHERE ArtistID = ?',
        [artistId]
      );
      const songCount = songRows[0]?.songCount || 0;
      const totalListens = songRows[0]?.totalListens || 0;

      const stats = {
        followerCount,
        albumCount,
        songCount,
        totalListens
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ stats }));
    } catch (error) {
      console.error('Get artist stats error:', error);
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

          const pool = await getPool();

          // Prepare file paths
          const audioFilePath = `/uploads/music/${audioFile.filename}`;
          const albumCoverPath = albumCover ? `/uploads/album-covers/${albumCover.filename}` : null;

          // Create song using controller
          const result = await songController.createSong(pool, musicData, audioFilePath, audioFile.size);
          console.log(`  ✅ Song created (ID: ${result.songId})`);

          // If album cover provided and albumId exists, update album cover
          if (albumCover && musicData.albumId && albumCoverPath) {
            await albumController.updateAlbumCover(pool, musicData.albumId, albumCoverPath);
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
    try {
      const pathParts = requestPath?.split('/') || [];
      const userId = parseInt(pathParts[3] || '0');
      const pool = await getPool();
      const user = await userController.getUserById(pool, userId);
      
      if (!user) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not found' }));
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ user }));
    } catch (error: any) {
      logError(error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Update user profile
  if (requestPath?.match(/^\/api\/users\/\d+$/) && method === 'PUT') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const pathParts = requestPath?.split('/') || [];
        const userId = parseInt(pathParts[3] || '0');
        const updateData = JSON.parse(body);
        
        console.log(`  📝 Updating user ${userId} with data:`, updateData);
        
        const pool = await getPool();
        
        // Update the user
        await userController.updateUser(pool, userId, updateData);
        console.log(`  ✅ User updated successfully`);
        
        // Fetch the updated user
        const updatedUser = await userController.getUserById(pool, userId);
        console.log(`  👤 Fetched updated user:`, updatedUser ? 'Success' : 'Failed');
        
        if (!updatedUser) {
          throw new Error('Failed to retrieve updated user');
        }
        
        logResponse(200, 'User updated successfully');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'User updated successfully',
          user: updatedUser 
        }));
      } catch (error: any) {
        logError(error);
        const statusCode = error.message.includes('not found') ? 404 : 
                          error.message.includes('already exists') ? 409 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Update user profile picture
  if (requestPath?.match(/^\/api\/users\/\d+\/profile-picture$/) && method === 'POST') {
    uploadProfilePicture.single('profilePicture')(req as any, res as any, async (err: any) => {
      if (err) {
        logError(err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Invalid profile picture upload' }));
        return;
      }

      try {
        const pathParts = requestPath?.split('/') || [];
        const userId = parseInt(pathParts[3] || '0');
        const file = (req as any).file;

        if (!file) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No profile picture provided' }));
          return;
        }

        const pool = await getPool();
        const existingUser = await userController.getUserById(pool, userId);
        if (!existingUser) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User not found' }));
          return;
        }

        const profilePicturePath = `/uploads/profile-pictures/${file.filename}`;

        await userController.updateProfilePicture(pool, userId, profilePicturePath);
        console.log(`  📸 Updated profile picture for user ${userId}`);

        // Remove previous profile picture file if it exists and differs
        if (existingUser.ProfilePicture && existingUser.ProfilePicture !== profilePicturePath) {
          const relativePath = existingUser.ProfilePicture.startsWith('/')
            ? existingUser.ProfilePicture.slice(1)
            : existingUser.ProfilePicture;
          const absolutePath = path.join(process.cwd(), relativePath);
          if (fs.existsSync(absolutePath)) {
            fs.unlink(absolutePath, (unlinkErr) => {
              if (unlinkErr) {
                console.warn(`  ⚠️ Failed to remove old profile picture: ${unlinkErr.message}`);
              } else {
                console.log('  🧹 Removed old profile picture');
              }
            });
          }
        }

        const updatedUser = await userController.getUserById(pool, userId);
        logResponse(200, 'Profile picture updated successfully');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Profile picture updated successfully',
          profilePicture: profilePicturePath,
          user: updatedUser
        }));
      } catch (error: any) {
        logError(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Get user's liked songs
  if (requestPath?.match(/^\/api\/users\/\d+\/liked-songs$/) && method === 'GET') {
    try {
      const pathParts = requestPath?.split('/') || [];
      const userId = parseInt(pathParts[3] || '0');
      const { page = '1', limit = '50' } = parsedUrl.query;
      const pool = await getPool();
      const likedSongs = likeController.getUserLikedSongs(pool, userId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ likedSongs }));
    } catch (error: any) {
      logError(error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Get user's following list
  if (requestPath?.match(/^\/api\/users\/\d+\/following$/) && method === 'GET') {
    try {
      const pathParts = requestPath?.split('/') || [];
      const userId = parseInt(pathParts[3] || '0');
      const { page = '1', limit = '50' } = parsedUrl.query;
      const pool = await getPool();
      
      const following = await followController.getUserFollowing(pool, userId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ following }));
    } catch (error: any) {
      logError(error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Get user's listening history
  if (requestPath?.match(/^\/api\/users\/\d+\/history$/) && method === 'GET') {
    try {
      const pathParts = requestPath?.split('/') || [];
      const userId = parseInt(pathParts[3] || '0');
      const { page = '1', limit = '50' } = parsedUrl.query;
      const pool = await getPool();
      
      const history = await historyController.getUserListeningHistory(pool, userId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ history }));
    } catch (error: any) {
      logError(error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Add song to user's listening history
  if (requestPath?.match(/^\/api\/users\/\d+\/history$/) && method === 'POST') {
    try {
      const pathParts = requestPath?.split('/') || [];
      const userId = parseInt(pathParts[3] || '0');
      
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const { songId, duration } = JSON.parse(body);
          const pool = await getPool();
          
          const result = await historyController.addListeningHistory(pool, {
            userId,
            songId,
            duration
          });
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, historyId: result.historyId }));
        } catch (error: any) {
          logError(error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
        }
      });
    } catch (error: any) {
      logError(error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Unified search across all entities
  if (requestPath === '/api/search' && method === 'GET') {
    try {
      const { query } = parsedUrl.query;
      
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Query parameter is required' }));
        return;
      }

      const pool = await getPool();
      const searchTerm = `%${query.trim()}%`;

      // Search artists (from userprofile + artist tables)
      const [artistRows] = await pool.execute<RowDataPacket[]>(`
        SELECT 
          u.UserID as ArtistID,
          u.FirstName,
          u.LastName,
          u.Username,
          u.ProfilePicture,
          a.VerifiedStatus,
          'artist' as type
        FROM userprofile u
        JOIN artist a ON u.UserID = a.ArtistID
        WHERE (u.FirstName LIKE ? OR u.LastName LIKE ? OR u.Username LIKE ?)
        AND u.UserType = 'Artist'
        LIMIT 5
      `, [searchTerm, searchTerm, searchTerm]);

      // Search albums
      const [albumRows] = await pool.execute<RowDataPacket[]>(`
        SELECT 
          a.AlbumID,
          a.AlbumName,
          a.AlbumCover,
          a.ReleaseDate,
          u.FirstName as ArtistFirstName,
          u.LastName as ArtistLastName,
          u.Username as ArtistUsername,
          'album' as type
        FROM album a
        JOIN artist ar ON a.ArtistID = ar.ArtistID
        JOIN userprofile u ON ar.ArtistID = u.UserID
        WHERE a.AlbumName LIKE ?
        LIMIT 5
      `, [searchTerm]);

      // Search songs
      const [songRows] = await pool.execute<RowDataPacket[]>(`
        SELECT 
          s.SongID,
          s.SongName,
          s.FilePath,
          s.Duration,
          s.ListenCount,
          u.FirstName as ArtistFirstName,
          u.LastName as ArtistLastName,
          u.Username as ArtistUsername,
          a.AlbumName,
          a.AlbumCover,
          'song' as type
        FROM song s
        JOIN artist ar ON s.ArtistID = ar.ArtistID
        JOIN userprofile u ON ar.ArtistID = u.UserID
        LEFT JOIN album a ON s.AlbumID = a.AlbumID
        WHERE s.SongName LIKE ?
        LIMIT 5
      `, [searchTerm]);

      // Search playlists (public only)
      const [playlistRows] = await pool.execute<RowDataPacket[]>(`
        SELECT 
          p.PlaylistID,
          p.PlaylistName,
          p.Description,
          p.CreatedAt,
          u.FirstName as CreatorFirstName,
          u.LastName as CreatorLastName,
          u.Username as CreatorUsername,
          'playlist' as type
        FROM playlist p
        JOIN userprofile u ON p.UserID = u.UserID
        WHERE p.PlaylistName LIKE ? AND p.IsPublic = 1
        LIMIT 5
      `, [searchTerm]);

      const searchResults = {
        query: query.trim(),
        results: {
          artists: artistRows,
          albums: albumRows,
          songs: songRows,
          playlists: playlistRows
        },
        totalResults: artistRows.length + albumRows.length + songRows.length + playlistRows.length
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(searchResults));
    } catch (error: any) {
      console.error('Search error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Search users
  if (requestPath === '/api/users/search' && method === 'GET') {
    try {
      const { query, page = '1', limit = '50' } = parsedUrl.query;
      const pool = await getPool();
      const users = userController.searchUsers(pool, (query as string) || '', {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      
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
      const pool = await getPool();
      
      let playlists;
      if (userId) {
        playlists = await playlistController.getPlaylistsByUser(pool, parseInt(userId as string));
      } else {
        playlists = await playlistController.getPublicPlaylists(pool, {
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

  // Get top playlists by like count (only public playlists)
  if (requestPath === '/api/playlists/top' && method === 'GET') {
    try {
      const pool = await getPool();
      const playlists = await playlistController.getTopPlaylistsByLikes(pool, 10);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ playlists }));
    } catch (error) {
      console.error('Get top playlists error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
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
        const pool = await getPool();
        
        const result = await playlistController.createPlaylist(pool, playlistData);
        
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
      const pool = await getPool();
      const playlist = await playlistController.getPlaylistById(pool, playlistId);
      
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
        const pool = await getPool();
        
        await playlistController.updatePlaylist(pool, playlistId, updateData);
        
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
      const pool = await getPool();
      
      await playlistController.deletePlaylist(pool, playlistId);
      
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
    const pathParts = requestPath?.split('/') || [];
    const playlistId = parseInt(pathParts[3] || '0');
    try {
      const pool = await getPool();
      const songs = await playlistController.getPlaylistSongs(pool, playlistId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ songs }));
    } catch (error: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Get playlist statistics
  if (requestPath?.match(/^\/api\/playlists\/\d+\/stats$/) && method === 'GET') {
    try {
      const playlistIdStr = requestPath.split('/')[3];
      if (!playlistIdStr) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid playlist ID' }));
        return;
      }
      const playlistId = parseInt(playlistIdStr);
      if (isNaN(playlistId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid playlist ID' }));
        return;
      }

      const pool = await getPool();
      
      // Get like count
      const [likeRows] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as likeCount FROM user_likes_playlist WHERE PlaylistID = ?',
        [playlistId]
      );
      const likeCount = likeRows[0]?.likeCount || 0;

      // Get song count and total duration
      const [songRows] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as songCount, COALESCE(SUM(s.Duration), 0) as totalDuration FROM playlist_song ps JOIN song s ON ps.SongID = s.SongID WHERE ps.PlaylistID = ?',
        [playlistId]
      );
      const songCount = songRows[0]?.songCount || 0;
      const totalDuration = songRows[0]?.totalDuration || 0;

      // Get playlist creation date
      const [playlistRows] = await pool.execute<RowDataPacket[]>(
        'SELECT CreatedAt FROM playlist WHERE PlaylistID = ?',
        [playlistId]
      );
      const createdAt = playlistRows[0]?.CreatedAt || null;

      // Get total plays (sum of listen counts for all songs in playlist)
      const [playsRows] = await pool.execute<RowDataPacket[]>(
        'SELECT COALESCE(SUM(s.ListenCount), 0) as totalPlays FROM playlist_song ps JOIN song s ON ps.SongID = s.SongID WHERE ps.PlaylistID = ?',
        [playlistId]
      );
      const totalPlays = playsRows[0]?.totalPlays || 0;

      const stats = {
        likeCount,
        songCount,
        totalDuration,
        totalPlays,
        createdAt
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ stats }));
    } catch (error) {
      console.error('Get playlist stats error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Add song to playlist
  if (requestPath?.match(/^\/api\/playlists\/\d+\/songs$/) && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const pathParts = requestPath?.split('/') || [];
        const playlistId = parseInt(pathParts[3] || '0');
        const { songId } = JSON.parse(body);
        const pool = await getPool();
        
        await playlistController.addSongToPlaylist(pool, playlistId, songId);
        
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
      const pathParts = requestPath?.split('/') || [];
      const playlistId = parseInt(pathParts[3] || '0');
      const songId = parseInt(pathParts[5] || '0');
      const pool = await getPool();
      
      // Verify playlist exists
      const playlist = await playlistController.getPlaylistById(pool, playlistId);
      if (!playlist) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Playlist not found' }));
        return;
      }
      
      await playlistController.removeSongFromPlaylist(pool, playlistId, songId);
      
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
        const pool = await getPool();
        
        await likeController.likeSong(pool, userId, songId);
        
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
        const pool = await getPool();
        
        await likeController.unlikeSong(pool, userId, songId);
        
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

  // Get user's like status for a song - /api/likes/songs/{userId}/status/{songId}
  if (requestPath && requestPath.startsWith('/api/likes/songs/') && requestPath.includes('/status/') && method === 'GET') {
    try {
      // Parse path: /api/likes/songs/{userId}/status/{songId}
      const pathParts = requestPath.split('/');
      if (pathParts.length === 7 && pathParts[5] === 'status') {
        const userId = parseInt(pathParts[4] || '0');
        const songId = parseInt(pathParts[6] || '0');
        
        const pool = await getPool();
        
        // Use existing controller functions
        const isLiked = await likeController.isSongLiked(pool, userId, songId);
        const likeCount = await likeController.getSongLikeCount(pool, songId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          isLiked,
          likeCount 
        }));
        return;
      }
    } catch (error: any) {
      logError(error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  // Like an album
  if (requestPath === '/api/likes/albums' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { userId, albumId } = JSON.parse(body);
        const pool = await getPool();
        
        await likeController.likeAlbum(pool, userId, albumId);
        
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
        const pool = await getPool();
        
        await likeController.unlikeAlbum(pool, userId, albumId);
        
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
        const pool = await getPool();
        
        await likeController.likePlaylist(pool, userId, playlistId);
        
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
        const pool = await getPool();
        
        await likeController.unlikePlaylist(pool, userId, playlistId);
        
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

  // ==================== RATING ROUTES ====================
  
  // Rate a song
  if (requestPath === '/api/ratings/songs' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { userId, songId, rating } = JSON.parse(body);
        const pool = await getPool();
        
        await ratingController.rateSong(pool, userId, songId, rating);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Song rated successfully' }));
      } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 :
                          error.message.includes('between 1 and 5') ? 400 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Get user's rating for a specific song
  if (requestPath?.match(/^\/api\/ratings\/songs\/\d+\/user\/\d+$/) && method === 'GET') {
    try {
      const pathParts = requestPath?.split('/') || [];
      const songId = parseInt(pathParts[4] || '0');
      const userId = parseInt(pathParts[6] || '0');
      const pool = await getPool();
      
      const rating = await ratingController.getUserSongRating(pool, userId, songId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ rating }));
    } catch (error: any) {
      logError(error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Get song rating statistics
  if (requestPath?.match(/^\/api\/ratings\/songs\/\d+\/stats$/) && method === 'GET') {
    try {
      const pathParts = requestPath?.split('/') || [];
      const songId = parseInt(pathParts[4] || '0');
      const pool = await getPool();
      
      const stats = await ratingController.getSongRatingStats(pool, songId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stats));
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      logError(error);
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Remove user's rating for a song
  if (requestPath === '/api/ratings/songs' && method === 'DELETE') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { userId, songId } = JSON.parse(body);
        const pool = await getPool();
        
        await ratingController.removeRating(pool, userId, songId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Rating removed successfully' }));
      } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        logError(error);
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    return;
  }

  // Get all ratings for a specific song
  if (requestPath?.match(/^\/api\/ratings\/songs\/\d+$/) && method === 'GET') {
    try {
      const pathParts = requestPath?.split('/') || [];
      const songId = parseInt(pathParts[4] || '0');
      const { page = '1', limit = '50' } = parsedUrl.query;
      const pool = await getPool();
      
      const ratings = await ratingController.getSongRatings(pool, songId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ratings }));
    } catch (error: any) {
      logError(error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Get user's all ratings
  if (requestPath?.match(/^\/api\/users\/\d+\/ratings$/) && method === 'GET') {
    try {
      const pathParts = requestPath?.split('/') || [];
      const userId = parseInt(pathParts[3] || '0');
      const { page = '1', limit = '50' } = parsedUrl.query;
      const pool = await getPool();
      
      const ratings = await ratingController.getUserRatings(pool, userId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ratings }));
    } catch (error: any) {
      logError(error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Get top rated songs
  if (requestPath === '/api/songs/top-rated' && method === 'GET') {
    try {
      const { limit = '10' } = parsedUrl.query;
      const pool = await getPool();
      
      const topSongs = await ratingController.getTopRatedSongs(pool, parseInt(limit as string));
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ songs: topSongs }));
    } catch (error: any) {
      logError(error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Get rating distribution for a song
  if (requestPath?.match(/^\/api\/ratings\/songs\/\d+\/distribution$/) && method === 'GET') {
    try {
      const pathParts = requestPath?.split('/') || [];
      const songId = parseInt(pathParts[4] || '0');
      const pool = await getPool();
      
      const distribution = await ratingController.getSongRatingDistribution(pool, songId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(distribution));
    } catch (error: any) {
      logError(error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
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
        const pool = await getPool();
        
        await followController.followArtist(pool, userId, artistId);
        
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
        const pool = await getPool();
        
        await followController.unfollowArtist(pool, userId, artistId);
        
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

  // Get artist's followers
  if (requestPath?.match(/^\/api\/artists\/\d+\/followers$/) && method === 'GET') {
    const pathParts = requestPath?.split('/') || [];
    const artistId = parseInt(pathParts[3] || '0');
    try {
      const { page = '1', limit = '50' } = parsedUrl.query;
      const pool = await getPool();
      const followers = await followController.getArtistFollowers(pool, artistId, {
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

  // Check if user is following artist
  if (requestPath?.match(/^\/api\/users\/\d+\/following\/\d+$/) && method === 'GET') {
    const pathParts = requestPath?.split('/') || [];
    const userId = parseInt(pathParts[3] || '0');
    const artistId = parseInt(pathParts[5] || '0');
    try {
      const pool = await getPool();
      const isFollowing = await followController.isFollowingArtist(pool, userId, artistId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ isFollowing }));
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
        const pool = await getPool();
        
        const result = await historyController.addListeningHistory(pool, historyData);
        
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

  // Get trending songs
  if (requestPath === '/api/trending' && method === 'GET') {
    try {
      const { days = '7', limit = '20' } = parsedUrl.query;
      const pool = await getPool();
      const songs = historyController.getTrendingSongs(pool, parseInt(days as string), parseInt(limit as string));
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ songs }));
    } catch (error: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
    }
    return;
  }

  // Helper function to check admin authentication
  const checkAdminAuth = (body: string): boolean => {
    try {
      const data = JSON.parse(body);
      return data.username === 'admin' && data.password === 'admin';
    } catch {
      return false;
    }
  };

  // Admin endpoint: Get all users
  if (requestPath === '/api/admin/users' && method === 'POST') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const requestData = JSON.parse(body);
        if (!checkAdminAuth(body)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Admin access required' }));
          return;
        }

        // Extract pagination parameters
        const page = parseInt(requestData.page) || 1;
        const limit = parseInt(requestData.limit) || 20;
        const offset = (page - 1) * limit;
        const search = requestData.search || '';

        // Extract filter parameters
        const filters = {
          dateOfBirthTo: requestData.dateOfBirthTo || '',
          dateJoinedTo: requestData.dateJoinedTo || '',
          country: requestData.country || '',
          city: requestData.city || '',
          userType: requestData.userType || '',
          accountStatus: requestData.accountStatus || '',
          createdAtTo: requestData.createdAtTo || '',
          updatedAtTo: requestData.updatedAtTo || ''
        };

        const pool = await getPool();
        
        // Build WHERE conditions
        const conditions: string[] = [];
        const queryParams: any[] = [];

        // Add search condition
        if (search) {
          conditions.push('(u.Username LIKE ? OR u.FirstName LIKE ? OR u.LastName LIKE ? OR u.Email LIKE ?)');
          queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Add filter conditions
        if (filters.dateOfBirthTo) {
          conditions.push('u.DateOfBirth <= ?');
          queryParams.push(filters.dateOfBirthTo);
        }
        if (filters.dateJoinedTo) {
          conditions.push('u.DateJoined <= ?');
          queryParams.push(filters.dateJoinedTo);
        }
        if (filters.country) {
          conditions.push('u.Country = ?');
          queryParams.push(filters.country);
        }
        if (filters.city) {
          conditions.push('u.City = ?');
          queryParams.push(filters.city);
        }
        if (filters.userType) {
          conditions.push('u.UserType = ?');
          queryParams.push(filters.userType);
        }
        if (filters.accountStatus) {
          conditions.push('u.AccountStatus = ?');
          queryParams.push(filters.accountStatus);
        }
        if (filters.createdAtTo) {
          conditions.push('u.CreatedAt <= ?');
          queryParams.push(filters.createdAtTo);
        }
        if (filters.updatedAtTo) {
          conditions.push('u.UpdatedAt <= ?');
          queryParams.push(filters.updatedAtTo);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        // Get total count for pagination
        const [countResult] = await pool.execute(
          `SELECT COUNT(*) as total FROM userprofile u ${whereClause}`,
          queryParams
        );
        const total = (countResult as any)[0].total;
        
        // Get paginated users
        const baseQuery = `
          SELECT 
            u.UserID, u.Username, u.FirstName, u.LastName, u.Email, 
            u.UserType, u.DateOfBirth, u.DateJoined, u.Country, u.City, u.IsOnline, 
            u.AccountStatus, u.ProfilePicture, u.CreatedAt, u.UpdatedAt,
            ul.LoginDate as LastLogin
          FROM userprofile u
          LEFT JOIN (
            SELECT UserID, MAX(LoginDate) as LoginDate 
            FROM user_logins 
            GROUP BY UserID
          ) ul ON u.UserID = ul.UserID
          ${whereClause}
          ORDER BY u.UserID
          LIMIT ${limit} OFFSET ${offset}
        `;
        const [users] = await pool.execute(baseQuery, queryParams);
        
        const totalPages = Math.ceil(total / limit);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          users, 
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // Admin endpoint: Get filter options for users
  if (requestPath === '/api/admin/users/filter-options' && method === 'POST') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        if (!checkAdminAuth(body)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Admin access required' }));
          return;
        }

        const pool = await getPool();
        
        // Get distinct countries
        const [countries] = await pool.execute(
          `SELECT DISTINCT Country FROM userprofile WHERE Country IS NOT NULL ORDER BY Country`
        );
        
        // Get distinct cities
        const [cities] = await pool.execute(
          `SELECT DISTINCT City FROM userprofile WHERE City IS NOT NULL ORDER BY City`
        );
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          countries: (countries as any[]).map(row => row.Country),
          cities: (cities as any[]).map(row => row.City)
        }));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // Admin endpoint: Delete/Ban user
  if (requestPath?.match(/^\/api\/admin\/users\/\d+$/) && method === 'DELETE') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        if (!checkAdminAuth(body)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Admin access required' }));
          return;
        }

        const userId = parseInt(requestPath.split('/')[4] || '0');
        if (isNaN(userId)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid user ID' }));
          return;
        }

        const pool = await getPool();
        await pool.execute('UPDATE userprofile SET AccountStatus = ? WHERE UserID = ?', ['Banned', userId]);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User banned successfully' }));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // Admin endpoint: Get platform statistics
  if (requestPath === '/api/admin/stats' && method === 'POST') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        if (!checkAdminAuth(body)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Admin access required' }));
          return;
        }

        const pool = await getPool();
        
        const [userStats] = await pool.execute('SELECT COUNT(*) as totalUsers FROM userprofile');
        const [songStats] = await pool.execute('SELECT COUNT(*) as totalSongs FROM song');
        const [albumStats] = await pool.execute('SELECT COUNT(*) as totalAlbums FROM album');
        const [playlistStats] = await pool.execute('SELECT COUNT(*) as totalPlaylists FROM playlist');
        const [activeUsers] = await pool.execute('SELECT COUNT(*) as activeUsers FROM userprofile WHERE IsOnline = 1');
        
        const stats = {
          totalUsers: (userStats as any)[0].totalUsers,
          totalSongs: (songStats as any)[0].totalSongs,
          totalAlbums: (albumStats as any)[0].totalAlbums,
          totalPlaylists: (playlistStats as any)[0].totalPlaylists,
          activeUsers: (activeUsers as any)[0].activeUsers
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ stats }));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // Admin endpoint: Get all songs with details
  if (requestPath === '/api/admin/songs' && method === 'POST') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const requestData = JSON.parse(body);
        if (!checkAdminAuth(body)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Admin access required' }));
          return;
        }

        // Extract pagination parameters
        const page = parseInt(requestData.page) || 1;
        const limit = parseInt(requestData.limit) || 20;
        const offset = (page - 1) * limit;
        const search = requestData.search || '';

        const pool = await getPool();
        
        // Build search condition
        const searchCondition = search 
          ? `WHERE (s.SongName LIKE ? OR u.Username LIKE ? OR a.AlbumName LIKE ? OR g.GenreName LIKE ?)` 
          : '';
        const searchParams = search 
          ? [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`] 
          : [];
        
        // Get total count for pagination
        const [countResult] = await pool.execute(
          `SELECT COUNT(*) as total FROM song s
           JOIN userprofile u ON s.ArtistID = u.UserID
           LEFT JOIN album a ON s.AlbumID = a.AlbumID
           LEFT JOIN genre g ON s.GenreID = g.GenreID
           ${searchCondition}`,
          searchParams
        );
        const total = (countResult as any)[0].total;
        
        // Get paginated songs
        const baseQuery = `
          SELECT 
            s.SongID, s.SongName as Title, s.Duration, s.ReleaseDate, s.FilePath,
            u.Username as ArtistName, u.FirstName, u.LastName,
            a.AlbumName as AlbumTitle, g.GenreName,
            (SELECT COUNT(*) FROM user_likes_song WHERE SongID = s.SongID) as LikeCount,
            (SELECT COUNT(*) FROM listening_history WHERE SongID = s.SongID) as PlayCount
          FROM song s
          JOIN userprofile u ON s.ArtistID = u.UserID
          LEFT JOIN album a ON s.AlbumID = a.AlbumID
          LEFT JOIN genre g ON s.GenreID = g.GenreID
          ${searchCondition}
          ORDER BY s.SongID DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        const [songs] = await pool.execute(baseQuery, searchParams);
        
        const totalPages = Math.ceil(total / limit);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          songs, 
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // Admin endpoint: Delete song
  if (requestPath?.match(/^\/api\/admin\/songs\/\d+$/) && method === 'DELETE') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        if (!checkAdminAuth(body)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Admin access required' }));
          return;
        }

        const songId = parseInt(requestPath.split('/')[4] || '0');
        if (isNaN(songId)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid song ID' }));
          return;
        }

        const pool = await getPool();
        
        // Delete related records first
        await pool.execute('DELETE FROM user_likes_song WHERE SongID = ?', [songId]);
        await pool.execute('DELETE FROM playlist_song WHERE SongID = ?', [songId]);
        await pool.execute('DELETE FROM listening_history WHERE SongID = ?', [songId]);
        
        // Delete the song
        await pool.execute('DELETE FROM song WHERE SongID = ?', [songId]);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Song deleted successfully' }));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // Admin endpoint: Get all albums
  if (requestPath === '/api/admin/albums' && method === 'POST') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const requestData = JSON.parse(body);
        if (!checkAdminAuth(body)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Admin access required' }));
          return;
        }

        // Extract pagination parameters
        const page = parseInt(requestData.page) || 1;
        const limit = parseInt(requestData.limit) || 20;
        const offset = (page - 1) * limit;
        const search = requestData.search || '';

        const pool = await getPool();
        
        // Build search condition
        const searchCondition = search 
          ? `WHERE (a.AlbumName LIKE ? OR u.Username LIKE ?)` 
          : '';
        const searchParams = search 
          ? [`%${search}%`, `%${search}%`] 
          : [];
        
        // Get total count for pagination
        const [countResult] = await pool.execute(
          `SELECT COUNT(*) as total FROM album a
           JOIN userprofile u ON a.ArtistID = u.UserID
           ${searchCondition}`,
          searchParams
        );
        const total = (countResult as any)[0].total;
        
        // Get paginated albums
        const baseQuery = `
          SELECT 
            a.AlbumID, a.AlbumName as Title, a.ReleaseDate, a.AlbumCover as CoverImagePath,
            u.Username as ArtistName, u.FirstName, u.LastName,
            (SELECT COUNT(*) FROM song WHERE AlbumID = a.AlbumID) as SongCount,
            (SELECT COUNT(*) FROM user_likes_album WHERE AlbumID = a.AlbumID) as LikeCount
          FROM album a
          JOIN userprofile u ON a.ArtistID = u.UserID
          ${searchCondition}
          ORDER BY a.AlbumID DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        const [albums] = await pool.execute(baseQuery, searchParams);
        
        const totalPages = Math.ceil(total / limit);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          albums, 
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // Admin endpoint: Delete album
  if (requestPath?.match(/^\/api\/admin\/albums\/\d+$/) && method === 'DELETE') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        if (!checkAdminAuth(body)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Admin access required' }));
          return;
        }

        const albumId = parseInt(requestPath.split('/')[4] || '0');
        if (isNaN(albumId)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid album ID' }));
          return;
        }

        const pool = await getPool();
        
        // Get songs in this album first
        const [songs] = await pool.execute('SELECT SongID FROM song WHERE AlbumID = ?', [albumId]);
        
        // Delete related records for each song
        for (const song of songs as any[]) {
          await pool.execute('DELETE FROM user_likes_song WHERE SongID = ?', [song.SongID]);
          await pool.execute('DELETE FROM playlist_song WHERE SongID = ?', [song.SongID]);
          await pool.execute('DELETE FROM listening_history WHERE SongID = ?', [song.SongID]);
        }
        
        // Delete songs in album
        await pool.execute('DELETE FROM song WHERE AlbumID = ?', [albumId]);
        
        // Delete album likes
        await pool.execute('DELETE FROM user_likes_album WHERE AlbumID = ?', [albumId]);
        
        // Delete the album
        await pool.execute('DELETE FROM album WHERE AlbumID = ?', [albumId]);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Album deleted successfully' }));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // Admin endpoint: Get all playlists
  if (requestPath === '/api/admin/playlists' && method === 'POST') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const requestData = JSON.parse(body);
        if (!checkAdminAuth(body)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Admin access required' }));
          return;
        }

        // Extract pagination parameters
        const page = parseInt(requestData.page) || 1;
        const limit = parseInt(requestData.limit) || 20;
        const offset = (page - 1) * limit;
        const search = requestData.search || '';

        const pool = await getPool();
        
        // Build search condition
        const searchCondition = search 
          ? `WHERE (p.PlaylistName LIKE ? OR u.Username LIKE ?)` 
          : '';
        const searchParams = search 
          ? [`%${search}%`, `%${search}%`] 
          : [];
        
        // Get total count for pagination
        const [countResult] = await pool.execute(
          `SELECT COUNT(*) as total FROM playlist p
           JOIN userprofile u ON p.UserID = u.UserID
           ${searchCondition}`,
          searchParams
        );
        const total = (countResult as any)[0].total;
        
        // Get paginated playlists
        const baseQuery = `
          SELECT 
            p.PlaylistID, p.PlaylistName, p.CreatedAt as DateCreated, p.IsPublic,
            u.Username as CreatorName, u.FirstName, u.LastName,
            (SELECT COUNT(*) FROM playlist_song WHERE PlaylistID = p.PlaylistID) as SongCount,
            (SELECT COUNT(*) FROM user_likes_playlist WHERE PlaylistID = p.PlaylistID) as LikeCount
          FROM playlist p
          JOIN userprofile u ON p.UserID = u.UserID
          ${searchCondition}
          ORDER BY p.PlaylistID DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        const [playlists] = await pool.execute(baseQuery, searchParams);
        
        const totalPages = Math.ceil(total / limit);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          playlists, 
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // Admin endpoint: Delete playlist
  if (requestPath?.match(/^\/api\/admin\/playlists\/\d+$/) && method === 'DELETE') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        if (!checkAdminAuth(body)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Admin access required' }));
          return;
        }

        const playlistId = parseInt(requestPath.split('/')[4] || '0');
        if (isNaN(playlistId)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid playlist ID' }));
          return;
        }

        const pool = await getPool();
        
        // Delete related records
        await pool.execute('DELETE FROM playlist_song WHERE PlaylistID = ?', [playlistId]);
        await pool.execute('DELETE FROM user_likes_playlist WHERE PlaylistID = ?', [playlistId]);
        
        // Delete the playlist
        await pool.execute('DELETE FROM playlist WHERE PlaylistID = ?', [playlistId]);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Playlist deleted successfully' }));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  console.log(`  ❌ No route found for: ${method} ${requestPath}`);
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('\n🚀 Starting CoogMusic Backend Server...\n');
    
    await initializeDatabase();
    await testConnection();
    
    // Always seed database on startup (for ephemeral storage on free tier)
    try {
      const { seedDatabase } = await import('./seed-database.js');
      await seedDatabase();
    } catch (seedError) {
      console.warn('⚠️  Database seeding skipped or failed:', (seedError as Error).message);
      console.log('📝 Continuing with empty database...\n');
    }
    
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

