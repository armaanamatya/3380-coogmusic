# Artist Table Auto-Creation Fix

## Problem
When users registered with `userType='Artist'`, they were only added to the `userprofile` table but NOT to the `artist` table. This caused the "Artist not found" error when they tried to upload music.

## Solution
Implemented automatic artist entry creation in three places:

### 1. During Registration ✅
**File:** `backend/src/controllers/authController.ts` - `registerUser()`

When a new user registers with `userType='Artist'`:
```typescript
// If user is an artist, create artist entry
if (userData.userType === 'Artist') {
  const artistStmt = db.prepare('INSERT INTO artist (ArtistID) VALUES (?)');
  artistStmt.run(userId);
}
```

### 2. During Login ✅
**File:** `backend/src/controllers/authController.ts` - `authenticateUser()`

When an artist logs in, check if their artist entry exists and create it if missing:
```typescript
// If user is an artist, ensure artist entry exists
if (user.UserType === 'Artist') {
  const artistExists = db.prepare('SELECT ArtistID FROM artist WHERE ArtistID = ?').get(user.UserID);
  if (!artistExists) {
    // Create artist entry if it doesn't exist (for legacy users)
    db.prepare('INSERT INTO artist (ArtistID) VALUES (?)').run(user.UserID);
  }
}
```

### 3. During Song Upload ✅
**File:** `backend/src/controllers/songController.ts` - `createSong()`

As a safety net, when creating a song, verify the user is an artist and create the entry if needed:
```typescript
// Verify user exists and is an artist
const user = db.prepare('SELECT UserID, UserType FROM userprofile WHERE UserID = ?').get(musicData.artistId);
if (!user) {
  throw new Error('User not found');
}
if (user.UserType !== 'Artist') {
  throw new Error('User is not an artist');
}

// Check if artist entry exists, if not create it
const artist = db.prepare('SELECT ArtistID FROM artist WHERE ArtistID = ?').get(musicData.artistId);
if (!artist) {
  // Auto-create artist entry
  db.prepare('INSERT INTO artist (ArtistID) VALUES (?)').run(musicData.artistId);
}
```

## Benefits

1. **Seamless Experience** - Artists can upload music immediately after registration
2. **Backward Compatible** - Existing artist users get their entry created on next login
3. **Triple Safety Net** - Entry is created at registration, login, or first upload
4. **Better Error Messages** - Clear distinction between "User not found" and "User is not an artist"

## Database Schema Reference

The `artist` table structure:
```sql
CREATE TABLE artist (
    ArtistID INTEGER PRIMARY KEY,
    ArtistBio TEXT,
    ArtistPFP BLOB,
    VerifiedStatus INTEGER NOT NULL DEFAULT 0,
    VerifyingAdminID INTEGER,
    DateVerified TEXT,
    CreatedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    UpdatedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (ArtistID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    FOREIGN KEY (VerifyingAdminID) REFERENCES userprofile(UserID) ON DELETE SET NULL
);
```

The `ArtistID` is a foreign key to `userprofile.UserID`, creating a 1-to-1 relationship.

## Testing

To test the fix:
1. ✅ Register a new user with `userType='Artist'`
2. ✅ Verify artist entry is created in the database
3. ✅ Login as the artist
4. ✅ Upload a song
5. ✅ Verify song is created successfully

For existing artist users:
1. ✅ Login with existing artist account
2. ✅ Verify artist entry is auto-created if missing
3. ✅ Upload a song
4. ✅ Verify song is created successfully

## Files Modified

1. `backend/src/controllers/authController.ts`
   - Updated `registerUser()` to create artist entry
   - Updated `authenticateUser()` to ensure artist entry exists

2. `backend/src/controllers/songController.ts`
   - Updated `createSong()` to verify user type and auto-create artist entry

## Status
✅ **COMPLETE** - Artist users are now automatically added to the artist table during registration and login.

