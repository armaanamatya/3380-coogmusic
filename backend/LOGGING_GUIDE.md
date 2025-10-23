# CoogMusic Backend Logging Guide

## Overview

The backend server now includes comprehensive request logging to help you monitor and debug API requests in real-time.

## Log Format

Each request is logged with the following information:

```
[2024-10-23T12:34:56.789Z] METHOD /path Query: {...}
  Context information...
  Response: STATUS - Message
  ⏱️  Duration: XXXms
```

## Request Logging

### General Format
- **Timestamp**: ISO 8601 format with milliseconds
- **Method**: HTTP method (GET, POST, PUT, DELETE)
- **Path**: Request endpoint
- **Query**: Query parameters (if present)
- **Duration**: Request processing time in milliseconds

### Excluded from Logs
To keep logs clean, the following are NOT logged:
- `/api/health` - Health check endpoint (too frequent)
- `/uploads/*` - Static file requests (clutters logs)
- `OPTIONS` requests - CORS preflight requests

## Endpoint-Specific Logs

### 🔐 Authentication

#### Registration (`POST /api/auth/register`)
```
[2024-10-23T12:34:56.789Z] POST /api/auth/register
  📝 Processing registration request...
  👤 User: johndoe (john@example.com)
  📷 Profile Picture: profile-1234567890.png
  ✅ User registered successfully (ID: 42)
  Response: 201 - User registered successfully
  ⏱️  Duration: 150ms
```

#### Login (`POST /api/auth/login`)
```
[2024-10-23T12:34:56.789Z] POST /api/auth/login
  🔐 Processing login request...
  👤 User: johndoe
  ✅ Login successful (ID: 42, Type: Artist)
  Response: 200 - Login successful
  ⏱️  Duration: 85ms
```

### 🎵 Songs

#### Get All Songs (`GET /api/song`)
```
[2024-10-23T12:34:56.789Z] GET /api/song Query: {"page":"1","limit":"20","genreId":"3"}
  🎵 Fetching songs...
  🎸 Filter by Genre ID: 3
  ✅ Found 15 songs
  Response: 200 - Returned 15 songs
  ⏱️  Duration: 45ms
```

#### Get Song by ID (`GET /api/song/:id`)
```
[2024-10-23T12:34:56.789Z] GET /api/song/5
  🎵 Fetching song ID: 5
  ✅ Found: Blinding Lights
  Response: 200 - Song retrieved
  ⏱️  Duration: 12ms
```

#### Upload Song (`POST /api/song/upload`)
```
[2024-10-23T12:34:56.789Z] POST /api/song/upload
  🎵 Processing music upload...
  🎵 Song: My New Song
  📁 Audio File: 1234567890.mp3 (4.52 MB)
  🖼️  Album Cover: cover-1234567890.jpg
  ✅ Song created (ID: 101)
  🖼️  Album cover updated for Album ID: 5
  Response: 201 - Music uploaded successfully
  ⏱️  Duration: 2345ms
```

### 💿 Albums

Logs show album operations including:
- Creating albums with artist details
- Updating album information
- Deleting albums and cleaning up files

### 🎤 Artists & 🎸 Genres

Simple GET requests showing:
- Number of records retrieved
- Request duration

## Error Logging

Errors are logged with the ❌ symbol and include:

```
[2024-10-23T12:34:56.789Z] POST /api/auth/login
  🔐 Processing login request...
  👤 User: wronguser
  ❌ Error: Invalid username or password
  ⏱️  Duration: 45ms
```

Common error scenarios:
- **400 Bad Request**: Invalid input, missing required fields
- **401 Unauthorized**: Invalid credentials
- **404 Not Found**: Resource doesn't exist
- **500 Internal Server Error**: Server-side errors

## Server Startup

When the server starts, you'll see:

```
🚀 Starting CoogMusic Backend Server...

Connected to SQLite database
Database schema already exists, skipping initialization
Database connection test successful
════════════════════════════════════════════════════════════
✅ Server running on http://localhost:3001
════════════════════════════════════════════════════════════

📋 Available Endpoints:
  🔐 Auth:       POST /api/auth/register, /api/auth/login
  🎵 Songs:      GET|PUT|DELETE /api/song/:id, POST /api/song/upload
  💿 Albums:     GET|POST /api/albums, PUT|DELETE /api/albums/:id
  🎤 Artists:    GET /api/artists
  🎸 Genres:     GET /api/genres
  📁 Files:      GET /uploads/*
  ❤️  Health:     GET /api/health, /api/test, /api/test-db

📝 Request logging is enabled
════════════════════════════════════════════════════════════

⏳ Waiting for requests...
```

## Icons Reference

| Icon | Meaning |
|------|---------|
| 🚀 | Server starting |
| ✅ | Success |
| ❌ | Error |
| 🔐 | Authentication |
| 👤 | User information |
| 📷 | Profile picture |
| 🎵 | Song operations |
| 📁 | File operations |
| 🖼️ | Image/cover operations |
| 💿 | Album operations |
| 🎤 | Artist operations |
| 🎸 | Genre operations |
| ⏱️ | Duration/timing |
| 📝 | Logging/processing |
| 📋 | List/menu |
| ❤️ | Health/status |

## Reading Logs

### Successful Request Example
```
[2024-10-23T12:34:56.789Z] GET /api/song Query: {"limit":"10"}
  🎵 Fetching songs...
  ✅ Found 10 songs
  Response: 200 - Returned 10 songs
  ⏱️  Duration: 25ms
```

**What this tells you:**
- Request received at 12:34:56.789
- Getting songs with limit of 10
- Successfully found 10 songs
- Responded with 200 OK status
- Request took 25ms total

### Failed Request Example
```
[2024-10-23T12:34:56.789Z] POST /api/auth/login
  🔐 Processing login request...
  👤 User: testuser
  ❌ Error: Invalid username or password
  ⏱️  Duration: 45ms
```

**What this tells you:**
- Login attempt at 12:34:56.789
- User 'testuser' tried to login
- Authentication failed
- Request took 45ms

## Performance Monitoring

The duration logs help you:
- Identify slow endpoints
- Detect performance issues
- Compare request times
- Monitor upload speeds

**Typical durations:**
- Simple GET requests: 10-50ms
- Database writes: 50-150ms
- File uploads: 1000-5000ms (depends on file size)
- Image uploads: 100-500ms

## Troubleshooting

### No Logs Appearing?
- Check if the endpoint is excluded (health checks, uploads)
- Verify server is running
- Check console output is not redirected

### Too Many Logs?
- Health checks and file serving are already excluded
- Consider filtering by timestamp or endpoint

### Need More Details?
- Check the error messages
- Review the request body/query parameters
- Look at the duration to identify bottlenecks

## Best Practices

1. **Monitor Duration**: Long durations may indicate performance issues
2. **Watch Error Patterns**: Repeated errors may need attention
3. **Check Success Rates**: High error rates indicate problems
4. **Review Upload Sizes**: Large files take longer to process
5. **Track User Activity**: See what endpoints are being used most

## Development vs Production

In development:
- ✅ Detailed logging enabled
- ✅ All request details shown
- ✅ Emojis for easy scanning

In production (recommended):
- Consider using structured logging (JSON)
- Add request IDs for tracking
- Integrate with log aggregation services
- Reduce verbosity for high-traffic endpoints

