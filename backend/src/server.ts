import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
const { hash, compare } = bcrypt;
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { initializeDatabase, testConnection, createConnection } from './database.js';

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
          const userData = (req as any).body;
          const profilePicture = (req as any).file;
          const db = await createConnection();

          // Check if username or email already exists
          const existingUser = db.prepare('SELECT UserID FROM userprofile WHERE Username = ? OR Email = ?').get(userData.username, userData.email);
          
          if (existingUser) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Username or email already exists' }));
            return;
          }

          // Hash the password
          const hashedPassword = await hash(userData.password, 10);

          // Set DateJoined to today and IsOnline to false
          const dateJoined = new Date().toISOString().split('T')[0];

          // Prepare profile picture path
          const profilePicturePath = profilePicture ? `/uploads/profile-pictures/${profilePicture.filename}` : null;

          // Insert new user
          const stmt = db.prepare(`
            INSERT INTO userprofile (Username, UserPassword, FirstName, LastName, DateOfBirth, Email, UserType, DateJoined, Country, City, IsOnline, AccountStatus, ProfilePicture)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          const result = stmt.run(
            userData.username,
            hashedPassword,
            userData.firstName,
            userData.lastName,
            userData.dateOfBirth,
            userData.email,
            userData.userType,
            dateJoined,
            userData.country,
            userData.city || null,
            0, // IsOnline = false
            'Active', // AccountStatus
            profilePicturePath
          );

          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            message: 'User registered successfully', 
            userId: result.lastInsertRowid 
          }));
        } catch (error) {
          console.error('Registration error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
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
        const { username, password } = JSON.parse(body);
        const db = await createConnection();

        // Find user by username
        const user = db.prepare('SELECT UserID, Username, UserPassword, UserType, FirstName, LastName, ProfilePicture FROM userprofile WHERE Username = ?').get(username) as any;
        
        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid username or password' }));
          return;
        }

        // Check password
        const passwordMatch = await compare(password, user.UserPassword);
        
        if (!passwordMatch) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid username or password' }));
          return;
        }

        // Update IsOnline status
        db.prepare('UPDATE userprofile SET IsOnline = 1 WHERE UserID = ?').run(user.UserID);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Login successful',
          userId: user.UserID,
          username: user.Username,
          userType: user.UserType,
          firstName: user.FirstName,
          lastName: user.LastName,
          profilePicture: user.ProfilePicture
        }));
      } catch (error) {
        console.error('Login error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    
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
