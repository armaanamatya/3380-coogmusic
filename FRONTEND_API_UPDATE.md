# Frontend API Routes Update Summary

## Overview
Updated all frontend components to use correct backend API endpoints and created a centralized API service for consistency.

## Changes Made

### 1. Created Centralized API Service
**File:** `frontend/src/services/api.ts`

This new file provides:
- Type-safe API calls
- Consistent endpoint management
- Single source of truth for all API routes
- Helper functions for file URLs

**API Modules:**
- `authApi` - Authentication endpoints (register, login)
- `songApi` - Song management (getAll, getById, upload, update, delete)
- `albumApi` - Album management (getAll, getById, create, update, delete)
- `artistApi` - Artist endpoints (getAll)
- `genreApi` - Genre endpoints (getAll)
- `healthApi` - Health check endpoints
- `getFileUrl()` - Helper for file URLs

### 2. Updated Components

#### Authentication Components
- **Login.tsx**
  - ✅ Updated to use `authApi.login()`
  - Changed from: `fetch('http://localhost:3001/api/auth/login', ...)`
  - Changed to: `authApi.login(formData)`

- **SignUp.tsx**
  - ✅ Updated to use `authApi.register()`
  - Changed from: `fetch('http://localhost:3001/api/auth/register', ...)`
  - Changed to: `authApi.register(formDataToSend)`

#### Music Components
- **MusicUploadForm.tsx**
  - ✅ Updated to use `songApi.upload()`
  - ✅ Updated to use `genreApi.getAll()`
  - ✅ Updated to use `albumApi.getAll()`
  - ✅ Updated to use `artistApi.getAll()`
  - **Fixed Route:** `/api/music/upload` → `/api/song/upload` ✅

- **MusicLibrary.tsx**
  - ✅ Updated to use `songApi.getAll()` with filters
  - ✅ Updated to use `songApi.delete()`
  - ✅ Updated to use `getFileUrl()` for audio playback and downloads
  - **Fixed Route:** `/api/music` → `/api/song` ✅
  - **Fixed Route:** `/api/music/:id` → `/api/song/:id` ✅

- **MusicEditForm.tsx**
  - ✅ Updated to use `songApi.update()`
  - ✅ Updated to use `genreApi.getAll()`
  - ✅ Updated to use `albumApi.getAll()`
  - **Fixed Route:** `/api/music/:id` → `/api/song/:id` ✅

#### Album Components
- **AlbumManager.tsx**
  - ✅ Updated to use `albumApi.getAll()`
  - ✅ Updated to use `albumApi.create()`
  - ✅ Updated to use `albumApi.update()`
  - ✅ Updated to use `albumApi.delete()`
  - ✅ Updated to use `artistApi.getAll()`

### 3. Backend Fix
**File:** `backend/src/server.ts`

- ✅ Fixed `profilePictureStorage` reference error
  - Changed from: `storage: profilePictureStorage`
  - Changed to: `storage: storage`
  - Line 36 now correctly references the defined `storage` variable

## Correct API Endpoints

### Authentication
```
POST /api/auth/register  - User registration with profile picture
POST /api/auth/login     - User login
```

### Songs
```
GET    /api/song              - Get all songs (with pagination & filters)
GET    /api/song/:id          - Get specific song by ID
POST   /api/song/upload       - Upload new song with audio file
PUT    /api/song/:id          - Update song
DELETE /api/song/:id          - Delete song
```

### Albums
```
GET    /api/albums            - Get all albums
GET    /api/albums/:id        - Get specific album
POST   /api/albums            - Create new album
PUT    /api/albums/:id        - Update album
DELETE /api/albums/:id        - Delete album
```

### Artists & Genres
```
GET    /api/artists           - Get all artists
GET    /api/genres            - Get all genres
```

### File Serving
```
GET    /uploads/profile-pictures/*  - Serve profile pictures
GET    /uploads/music/*             - Serve audio files
GET    /uploads/album-covers/*      - Serve album covers
```

## Benefits

1. **Consistency:** All API calls now use the same centralized service
2. **Maintainability:** Easy to update endpoints in one place
3. **Type Safety:** Better TypeScript support with defined interfaces
4. **Error Prevention:** No more incorrect endpoint paths
5. **Code Reusability:** Shared API logic across components

## Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] Music upload works (now using `/api/song/upload`)
- [ ] Music library displays songs (now using `/api/song`)
- [ ] Song editing works (now using `/api/song/:id`)
- [ ] Song deletion works
- [ ] Album creation works
- [ ] Album editing works
- [ ] Album deletion works
- [ ] Audio playback works
- [ ] File downloads work

## Next Steps

1. Test all endpoints to ensure they work correctly
2. Consider adding error handling middleware
3. Consider adding request/response interceptors
4. Add authentication tokens to API calls (when auth is fully implemented)
5. Add loading states and better error messages

## Notes

- All hardcoded `http://localhost:3001` URLs have been replaced with API service calls
- The API base URL is defined once in `api.ts` and can be easily changed for different environments
- File URLs are now generated using the `getFileUrl()` helper function

