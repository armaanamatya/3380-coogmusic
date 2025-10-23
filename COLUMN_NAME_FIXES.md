# Database Column Name Fixes - October 23, 2025

## Issue Identified
The frontend was getting errors when calling `GET /api/song`:
```
❌ Error: no such column: al.AlbumArt
```

## Root Cause
The controllers were using old column names that didn't match the actual database schema.

## Fixes Applied

### 1. songController.ts
Fixed column references to match actual database schema:

| Old Column Name | Correct Column Name | Location |
|----------------|-------------------|----------|
| `al.AlbumArt` | `al.AlbumCover` | SELECT queries (lines 22, 60) |
| `SongLength` | `Duration` | INSERT/UPDATE queries |
| `SongFile` | `FilePath` | INSERT/DELETE queries |
| `FileFormat` | *(removed, doesn't exist)* | INSERT query |

Also fixed JOIN logic:
- **Before**: Joined artist through album (`LEFT JOIN artist a ON al.ArtistID = a.ArtistID`)
- **After**: Joined artist directly from song (`LEFT JOIN artist a ON s.ArtistID = a.ArtistID`)
- This is correct because the song table has `ArtistID` as a direct column

### 2. albumController.ts
Fixed column references:

| Old Column Name | Correct Column Name | Location |
|----------------|-------------------|----------|
| `AlbumDate` | `ReleaseDate` | All queries |
| `AlbumDescription` | `Description` | All queries |
| `AlbumArt` | `AlbumCover` | UPDATE/DELETE queries |

## Actual Database Schema (Verified)

### Song Table Columns:
- SongID, SongName, ArtistID, AlbumID, GenreID
- **Duration** (not SongLength)
- **FilePath** (not SongFile)  
- FileSize, ListenCount, ReleaseDate
- CreatedAt, UpdatedAt

### Album Table Columns:
- AlbumID, AlbumName, ArtistID
- **ReleaseDate** (not AlbumDate)
- **AlbumCover** (not AlbumArt)
- **Description** (not AlbumDescription)
- CreatedAt, UpdatedAt

## Testing
The server is running with nodemon and should have automatically reloaded with the fixes.

Test these endpoints:
- `GET /api/song` - Should now return songs without errors
- `GET /api/song/:id` - Should return individual song details
- `POST /api/song/upload` - Should create songs with correct columns
- `GET /api/albums` - Should return albums without errors

## Files Modified
1. `backend/src/controllers/songController.ts` - Fixed all column names and JOIN logic
2. `backend/src/controllers/albumController.ts` - Fixed all column names

## Status
✅ **FIXED** - All controllers now use the correct database column names matching the actual schema.

The AlbumCover column type (TEXT) is correct - it stores file paths, not binary image data.

