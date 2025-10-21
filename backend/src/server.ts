import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'bcryptjs';
const { hash, compare } = pkg;
import { initializeDatabase, testConnection, createConnection } from './database.js';

dotenv.config();

const PORT = process.env.PORT || 3001;

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const parsedUrl = parse(req.url || '', true);
  const path = parsedUrl.pathname;
  const method = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (path === '/api/health' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', message: 'Server is running' }));
    return;
  }

  if (path === '/api/test' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Hello from Node.js TypeScript backend!' }));
    return;
  }

  // User Registration Endpoint
  if (path === '/api/auth/register' && method === 'POST') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const userData = JSON.parse(body);
        const db = await createConnection();

        // Check if username or email already exists
        const existingUser = db.prepare('SELECT UserID FROM user WHERE Username = ? OR Email = ?').get(userData.username, userData.email);
        
        if (existingUser) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Username or email already exists' }));
          return;
        }

        // Hash the password
        const hashedPassword = await hash(userData.password, 10);

        // Set DateJoined to today and IsOnline to false
        const dateJoined = new Date().toISOString().split('T')[0];

        // Insert new user
        const stmt = db.prepare(`
          INSERT INTO user (Username, UserPassword, FirstName, LastName, DateOfBirth, Email, UserType, DateJoined, Country, City, IsOnline, AccountStatus)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          'Active' // AccountStatus
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
    
    return;
  }

  // User Login Endpoint
  if (path === '/api/auth/login' && method === 'POST') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { username, password } = JSON.parse(body);
        const db = await createConnection();

        // Find user by username
        const user = db.prepare('SELECT UserID, Username, UserPassword, UserType, FirstName, LastName FROM user WHERE Username = ?').get(username) as any;
        
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
        db.prepare('UPDATE user SET IsOnline = 1 WHERE UserID = ?').run(user.UserID);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Login successful',
          userId: user.UserID,
          username: user.Username,
          userType: user.UserType,
          firstName: user.FirstName,
          lastName: user.LastName
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