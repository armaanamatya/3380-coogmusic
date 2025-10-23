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

const upload = multer({
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

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const parsedUrl = parse(req.url || '', true);
  const requestPath = parsedUrl.pathname;
  const method = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (requestPath === '/api/health' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', message: 'Server is running' }));
    return;
  }

  // Serve uploaded profile pictures
  if (requestPath?.startsWith('/uploads/') && method === 'GET') {
    const filePath = path.join(process.cwd(), requestPath);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const contentTypeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };
      const contentType = contentTypeMap[ext] || 'application/octet-stream';

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
    try {
      // Use multer to handle multipart/form-data
      upload.single('profilePicture')(req as any, res as any, async (err: any) => {
        if (err) {
          console.error('Upload error:', err);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
          return;
        }

        try {
          const userData = (req as any).body as RegisterUserData;
          const profilePicture = (req as any).file;
          const db = await createConnection();

          // Prepare profile picture path
          const profilePicturePath = profilePicture ? `/uploads/profile-pictures/${profilePicture.filename}` : null;

          // Register user using controller
          const result = await authController.registerUser(db, userData, profilePicturePath);

          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            message: 'User registered successfully', 
            userId: result.userId 
          }));
        } catch (error: any) {
          console.error('Registration error:', error);
          const statusCode = error.message.includes('already exists') ? 400 : 500;
          res.writeHead(statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    
    return;
  }

  // User Login Endpoint
  if (requestPath === '/api/auth/login' && method === 'POST') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const credentials = JSON.parse(body) as LoginCredentials;
        const db = await createConnection();

        // Authenticate user using controller
        const userData = await authController.authenticateUser(db, credentials);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Login successful',
          ...userData
        }));
      } catch (error: any) {
        console.error('Login error:', error);
        const statusCode = error.message.includes('Invalid') ? 401 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
    
    return;
  }

  // Get all music/songs
  if (requestPath === '/api/music' && method === 'GET') {
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
      }
      if (genreId) {
        filters.genreId = parseInt(genreId as string);
      }
      if (albumId) {
        filters.albumId = parseInt(albumId as string);
      }
      
      const songs = songController.getAllSongs(db, filters);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ songs }));
    } catch (error) {
      console.error('Get music error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Get specific song
  if (requestPath?.match(/^\/api\/music\/\d+$/) && method === 'GET') {
    try {
      const songId = parseInt(requestPath.split('/').pop() || '0');
      const db = await createConnection();
      
      const song = songController.getSongById(db, songId);
      
      if (!song) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Song not found' }));
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ song }));
    } catch (error) {
      console.error('Get song error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Update song
  if (requestPath?.match(/^\/api\/music\/\d+$/) && method === 'PUT') {
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
  if (requestPath?.match(/^\/api\/music\/\d+$/) && method === 'DELETE') {
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
  if (requestPath === '/api/music/upload' && method === 'POST') {
    try {
      uploadMusic.fields([
        { name: 'audioFile', maxCount: 1 },
        { name: 'albumCover', maxCount: 1 }
      ])(req as any, res as any, async (err: any) => {
        if (err) {
          console.error('Music upload error:', err);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
          return;
        }

        try {
          const musicData = (req as any).body as UploadMusicData;
          const files = (req as any).files;
          const audioFile = files?.audioFile?.[0];
          const albumCover = files?.albumCover?.[0];

          if (!audioFile) {
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

          // If album cover provided and albumId exists, update album cover
          if (albumCover && musicData.albumId && albumCoverPath) {
            albumController.updateAlbumCover(db, musicData.albumId, albumCoverPath);
          }

          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            message: 'Music uploaded successfully', 
            songId: result.songId,
            audioFilePath: result.audioFilePath,
            albumCoverPath
          }));
        } catch (error: any) {
          console.error('Music upload error:', error);
          const statusCode = error.message.includes('not found') ? 400 : 500;
          res.writeHead(statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
        }
      });
    } catch (error) {
      console.error('Music upload error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    await testConnection();
    
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
