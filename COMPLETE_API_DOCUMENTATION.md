# CoogMusic Complete API Documentation

Base URL: `http://localhost:3001`

## ✅ All Available Endpoints

### 🔐 Authentication
```
POST /api/auth/register   - User registration with profile picture
POST /api/auth/login      - User login
```

### 👤 User Management
```
GET    /api/users/:id           - Get user by ID
PUT    /api/users/:id           - Update user profile
GET    /api/users/search        - Search users by query
GET    /api/users/:id/liked-songs    - Get user's liked songs
GET    /api/users/:id/following      - Get artists the user follows
GET    /api/users/:id/history        - Get user's listening history
```

### 🎵 Songs
```
GET    /api/song                - Get all songs (with pagination & filters)
GET    /api/song/:id            - Get specific song by ID
PUT    /api/song/:id            - Update song
DELETE /api/song/:id            - Delete song
POST   /api/song/upload         - Upload new song with audio file
```

### 💿 Albums
```
GET    /api/albums              - Get all albums (with optional artistId filter)
GET    /api/albums/:id          - Get specific album
POST   /api/albums              - Create new album
PUT    /api/albums/:id          - Update album
DELETE /api/albums/:id          - Delete album
```

### 🎤 Artists
```
GET    /api/artists                  - Get all artists
GET    /api/artists/:id/followers    - Get artist's followers
```

### 🎸 Genres
```
GET    /api/genres              - Get all genres
```

### 📋 Playlists
```
GET    /api/playlists                        - Get public playlists or user playlists (with userId param)
POST   /api/playlists                        - Create new playlist
GET    /api/playlists/:id                    - Get specific playlist
PUT    /api/playlists/:id                    - Update playlist
DELETE /api/playlists/:id                    - Delete playlist
GET    /api/playlists/:id/songs              - Get songs in playlist
POST   /api/playlists/:id/songs              - Add song to playlist
DELETE /api/playlists/:id/songs/:songId      - Remove song from playlist
```

### ❤️ Likes
```
POST   /api/likes/songs          - Like a song
DELETE /api/likes/songs          - Unlike a song
POST   /api/likes/albums         - Like an album
DELETE /api/likes/albums         - Unlike an album
POST   /api/likes/playlists      - Like a playlist
DELETE /api/likes/playlists      - Unlike a playlist
```

### 👥 Follows
```
POST   /api/follows              - Follow an artist
DELETE /api/follows              - Unfollow an artist
```

### 📊 Listening History
```
POST   /api/history              - Add listening history entry
GET    /api/trending             - Get trending songs
```

### 📁 File Serving
```
GET    /uploads/profile-pictures/*  - Serve profile pictures
GET    /uploads/music/*             - Serve audio files
GET    /uploads/album-covers/*      - Serve album covers
```

### ❤️ Health Checks
```
GET    /api/health              - Server health check
GET    /api/test                - Basic test endpoint
GET    /api/test-db             - Database connection test
```

---

## 📖 Detailed Endpoint Documentation

### Authentication

#### Register User
```
POST /api/auth/register
Content-Type: multipart/form-data

Body (FormData):
- username: string
- password: string
- firstName: string
- lastName: string
- dateOfBirth: string (YYYY-MM-DD)
- email: string
- userType: string ('Listener' | 'Artist')
- country: string
- city: string (optional)
- profilePicture: File (optional)

Response: 201
{
  "message": "User registered successfully",
  "userId": number
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

Body:
{
  "username": "string",
  "password": "string"
}

Response: 200
{
  "message": "Login successful",
  "userId": number,
  "username": "string",
  "userType": "string",
  ...userProfile
}
```

### User Management

#### Get User by ID
```
GET /api/users/:id

Response: 200
{
  "user": {
    "UserID": number,
    "Username": "string",
    "FirstName": "string",
    "LastName": "string",
    "Email": "string",
    "UserType": "string",
    "Country": "string",
    "ProfilePicture": "string | null",
    ...
  }
}
```

#### Update User
```
PUT /api/users/:id
Content-Type: application/json

Body:
{
  "Username"?: "string",
  "FirstName"?: "string",
  "LastName"?: "string",
  "Email"?: "string",
  "Country"?: "string",
  "City"?: "string"
}

Response: 200
{
  "message": "User updated successfully"
}
```

#### Search Users
```
GET /api/users/search?query=searchTerm

Response: 200
{
  "users": [...]
}
```

### Songs

#### Get All Songs
```
GET /api/song?page=1&limit=20&artistId=1&genreId=2&albumId=3

Query Parameters:
- page: number (default: 1)
- limit: number (default: 50)
- artistId: number (optional)
- genreId: number (optional)
- albumId: number (optional)

Response: 200
{
  "songs": [
    {
      "SongID": number,
      "SongName": "string",
      "ArtistID": number,
      "ArtistFirstName": "string",
      "ArtistLastName": "string",
      "AlbumName": "string | null",
      "AlbumCover": "string | null",
      "GenreName": "string | null",
      "Duration": number,
      "FilePath": "string",
      ...
    }
  ]
}
```

#### Upload Song
```
POST /api/song/upload
Content-Type: multipart/form-data

Body (FormData):
- songName: string
- artistId: number
- albumId: number (optional)
- genreId: number (optional)
- duration: number (seconds)
- audioFile: File
- albumCover: File (optional)

Response: 201
{
  "message": "Music uploaded successfully",
  "songId": number,
  "audioFilePath": "string",
  "albumCoverPath": "string | null"
}
```

### Playlists

#### Create Playlist
```
POST /api/playlists
Content-Type: application/json

Body:
{
  "playlistName": "string",
  "userId": number,
  "description": "string" (optional),
  "isPublic": boolean (optional, default: false)
}

Response: 201
{
  "message": "Playlist created successfully",
  "playlistId": number
}
```

#### Get Playlists
```
GET /api/playlists?userId=1&page=1&limit=50

Query Parameters:
- userId: number (optional, filters by user)
- page: number (default: 1)
- limit: number (default: 50)

Response: 200
{
  "playlists": [...]
}
```

#### Add Song to Playlist
```
POST /api/playlists/:playlistId/songs
Content-Type: application/json

Body:
{
  "songId": number
}

Response: 200
{
  "message": "Song added to playlist"
}
```

### Likes

#### Like a Song
```
POST /api/likes/songs
Content-Type: application/json

Body:
{
  "userId": number,
  "songId": number
}

Response: 200
{
  "message": "Song liked successfully"
}
```

#### Unlike a Song
```
DELETE /api/likes/songs
Content-Type: application/json

Body:
{
  "userId": number,
  "songId": number
}

Response: 200
{
  "message": "Song unliked successfully"
}
```

### Follows

#### Follow an Artist
```
POST /api/follows
Content-Type: application/json

Body:
{
  "userId": number,
  "artistId": number
}

Response: 200
{
  "message": "Artist followed successfully"
}
```

#### Unfollow an Artist
```
DELETE /api/follows
Content-Type: application/json

Body:
{
  "userId": number,
  "artistId": number
}

Response: 200
{
  "message": "Artist unfollowed successfully"
}
```

### Listening History

#### Add Listening History
```
POST /api/history
Content-Type: application/json

Body:
{
  "userId": number,
  "songId": number,
  "duration": number (optional, seconds listened)
}

Response: 201
{
  "message": "Listening history added",
  "historyId": number
}
```

#### Get Trending Songs
```
GET /api/trending?days=7&limit=20

Query Parameters:
- days: number (default: 7, trending within last N days)
- limit: number (default: 20)

Response: 200
{
  "songs": [...]
}
```

---

## 🎨 Frontend Usage Examples

### Using the API Service

```typescript
import { 
  authApi, 
  songApi, 
  playlistApi, 
  likeApi, 
  followApi, 
  historyApi, 
  userApi 
} from './services/api';

// Authentication
const response = await authApi.login({ username: 'john', password: '123' });
const data = await response.json();

// Get songs
const songs = await songApi.getAll({ page: 1, limit: 20, genreId: 3 });

// Create playlist
await playlistApi.create({
  playlistName: 'My Favorites',
  userId: 1,
  isPublic: true
});

// Like a song
await likeApi.likeSong(userId, songId);

// Follow an artist
await followApi.followArtist(userId, artistId);

// Add listening history
await historyApi.add({ userId, songId, duration: 180 });

// Get trending songs
const trending = await historyApi.getTrending({ days: 7, limit: 20 });
```

---

## 🔧 Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors, already exists, etc.)
- `404` - Not Found
- `500` - Internal Server Error

Error Response Format:
```json
{
  "error": "Error message describing what went wrong"
}
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format
- File paths are relative to the server root (e.g., `/uploads/music/filename.mp3`)
- Pagination defaults: page=1, limit=50
- CORS is enabled for all origins
- Request logging is enabled for debugging

---

## ✅ Implementation Status

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Authentication | ✅ | ✅ | Complete |
| Songs | ✅ | ✅ | Complete |
| Albums | ✅ | ✅ | Complete |
| Artists | ✅ | ✅ | Complete |
| Genres | ✅ | ✅ | Complete |
| Users | ✅ | ✅ | Complete |
| Playlists | ✅ | ✅ | Complete |
| Likes | ✅ | ✅ | Complete |
| Follows | ✅ | ✅ | Complete |
| History | ✅ | ✅ | Complete |

---

## 🚀 Getting Started

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test API:**
   - Health Check: `http://localhost:3001/api/health`
   - Database Test: `http://localhost:3001/api/test-db`

---

## 📦 Database Schema

The API uses SQLite with the following tables:
- `userprofile` - User accounts
- `artist` - Artist profiles
- `genre` - Music genres
- `album` - Albums
- `song` - Songs
- `playlist` - User playlists
- `playlist_song` - Playlist-song relationships
- `user_follows_artist` - Follow relationships
- `user_likes_song` - Song likes
- `user_likes_album` - Album likes
- `user_likes_playlist` - Playlist likes
- `listening_history` - Play history tracking

For full schema details, see `backend/src/schema.sqlite.sql`

