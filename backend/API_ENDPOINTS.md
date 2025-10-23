# CoogMusic API Endpoints

Base URL: `http://localhost:3001`

## ✅ Currently Available Endpoints

### Health & Testing
```
GET  /api/health          - Server health check
GET  /api/test            - Basic test endpoint  
GET  /api/test-db         - Database connection test with counts
```

### Authentication
```
POST /api/auth/register   - User registration with profile picture
POST /api/auth/login      - User login
```

**Register Example:**
```javascript
const formData = new FormData();
formData.append('username', 'johndoe');
formData.append('password', 'password123');
formData.append('firstName', 'John');
formData.append('lastName', 'Doe');
formData.append('dateOfBirth', '1990-01-01');
formData.append('email', 'john@example.com');
formData.append('userType', 'Listener'); // or 'Artist'
formData.append('country', 'USA');
formData.append('city', 'Houston');
formData.append('profilePicture', fileObject); // optional

fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  body: formData
});
```

**Login Example:**
```javascript
fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    password: 'password123'
  })
});
```

### Songs
```
GET    /api/song                    - Get all songs (with pagination & filters)
GET    /api/song/:id                - Get specific song by ID
PUT    /api/song/:id                - Update song
DELETE /api/song/:id                - Delete song
POST   /api/song/upload             - Upload new song with audio file
```

**Get Songs Example:**
```javascript
// Get all songs with filters
fetch('http://localhost:3001/api/song?page=1&limit=20&genreId=3')
  .then(res => res.json())
  .then(data => console.log(data.songs));
```

**Upload Song Example:**
```javascript
const formData = new FormData();
formData.append('songName', 'My Song');
formData.append('artistId', '1');
formData.append('albumId', '5'); // optional
formData.append('genreId', '3'); // optional
formData.append('duration', '180'); // seconds
formData.append('fileFormat', 'mp3');
formData.append('audioFile', audioFileObject);
formData.append('albumCover', coverImageObject); // optional

fetch('http://localhost:3001/api/song/upload', {
  method: 'POST',
  body: formData
});
```

### Albums
```
GET    /api/albums                  - Get all albums (with optional artistId filter)
GET    /api/albums/:id              - Get specific album
POST   /api/albums                  - Create new album
PUT    /api/albums/:id              - Update album
DELETE /api/albums/:id              - Delete album
```

**Create Album Example:**
```javascript
fetch('http://localhost:3001/api/albums', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    albumName: 'My Album',
    artistId: 1,
    releaseDate: '2024-01-01',
    description: 'Album description'
  })
});
```

### Artists
```
GET    /api/artists                 - Get all artists
```

### Genres
```
GET    /api/genres                  - Get all genres
```

### File Serving
```
GET    /uploads/profile-pictures/*  - Serve profile pictures
GET    /uploads/music/*             - Serve audio files
GET    /uploads/album-covers/*      - Serve album covers
```

## 🚀 Ready to Add (Controllers Created)

These controllers are ready but routes need to be added to `server.ts`:

### Playlists (playlistController)
- Create, read, update, delete playlists
- Add/remove songs from playlists
- Get playlist songs
- Reorder playlist songs
- Get public playlists
- Get user playlists

### User Management (userController)
- Get user by ID or username
- Update user profile
- Update user type
- Update online status
- Update account status
- Search users
- Delete user

### Likes (likeController)
- Like/unlike songs, albums, playlists
- Get user's liked songs, albums, playlists
- Check if item is liked
- Get like counts

### Follows (followController)
- Follow/unfollow artists
- Get user's following list
- Get artist's followers
- Check follow status
- Get follower/following counts
- Get mutual follows

### Listening History (historyController)
- Add listening history entry
- Get user's listening history
- Get song's listening history
- Get most played songs/artists
- Get trending songs
- Get listening statistics
- Clear history

## Frontend Integration

### Example API Service
```typescript
// frontend/src/services/api.ts
const API_BASE = 'http://localhost:3001';

export const api = {
  // Auth
  register: (formData: FormData) => 
    fetch(`${API_BASE}/api/auth/register`, { method: 'POST', body: formData }),
  
  login: (credentials: { username: string; password: string }) =>
    fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    }),

  // Songs
  getSongs: (params?: { page?: number; limit?: number; genreId?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetch(`${API_BASE}/api/song?${query}`);
  },

  getSongById: (id: number) => 
    fetch(`${API_BASE}/api/song/${id}`),

  // Albums
  getAlbums: (artistId?: number) => {
    const query = artistId ? `?artistId=${artistId}` : '';
    return fetch(`${API_BASE}/api/albums${query}`);
  },

  // Artists
  getArtists: () => 
    fetch(`${API_BASE}/api/artists`),

  // Genres
  getGenres: () => 
    fetch(`${API_BASE}/api/genres`)
};
```

## Database Schema Status

✅ All tables have corresponding controllers
✅ Database is SQLite (better-sqlite3)
✅ Schema file: `backend/src/schema.sqlite.sql`
✅ Database file: `backend/coogmusic.db`

## Next Steps

1. **Test existing endpoints** - All auth, song, album, artist, and genre endpoints are working
2. **Add routes for new controllers** - Playlists, likes, follows, and history controllers are ready
3. **Frontend integration** - Start using the available endpoints in your React components
4. **Add authentication middleware** - Protect routes that require user login
5. **Add request validation** - Validate input data before processing

## Notes

- Server runs on port 3001
- CORS is enabled for all origins
- File uploads supported (profile pictures, music, album covers)
- All responses are JSON format
- Errors include descriptive messages

