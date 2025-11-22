-- CoogMusic Database Schema
-- This schema supports a music streaming platform with users, artists, genres, albums, songs, and playlists

-- User Profile Table
CREATE TABLE userprofile (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    Username TEXT NOT NULL UNIQUE,
    UserPassword TEXT NOT NULL,
    FirstName TEXT NOT NULL,
    LastName TEXT NOT NULL,
    DateOfBirth TEXT NOT NULL,
    Email TEXT NOT NULL UNIQUE,
    UserType TEXT NOT NULL DEFAULT 'Listener' CHECK (UserType IN ('Listener', 'Artist', 'Administrator', 'Analyst')),
    DateJoined TEXT NOT NULL DEFAULT (DATE('now')),
    Country TEXT NOT NULL,
    City TEXT,
    AccountStatus TEXT NOT NULL DEFAULT 'Active' CHECK (AccountStatus IN ('Active', 'Suspended', 'Banned')),
    IsOnline INTEGER NOT NULL DEFAULT 0,
    LastLogin TEXT,
    ProfilePicture TEXT,
    CreatedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    UpdatedAt TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- Artist Profile Table (extends user profile)
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

-- Genre Table
CREATE TABLE genre (
    GenreID INTEGER PRIMARY KEY AUTOINCREMENT,
    GenreName TEXT NOT NULL UNIQUE,
    Description TEXT,
    CreatedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    UpdatedAt TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- Album Table
CREATE TABLE album (
    AlbumID INTEGER PRIMARY KEY AUTOINCREMENT,
    AlbumName TEXT NOT NULL,
    ArtistID INTEGER NOT NULL,
    ReleaseDate TEXT NOT NULL,
    AlbumCover TEXT,
    Description TEXT,
    AverageRating REAL DEFAULT 0.00, -- Average rating from 1.00 to 5.00
    TotalRatings INTEGER DEFAULT 0, -- Total number of ratings received
    CreatedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    UpdatedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (ArtistID) REFERENCES artist(ArtistID) ON DELETE CASCADE
);

-- Song Table
CREATE TABLE song (
    SongID INTEGER PRIMARY KEY AUTOINCREMENT,
    SongName TEXT NOT NULL,
    ArtistID INTEGER NOT NULL,
    AlbumID INTEGER,
    GenreID INTEGER,
    Duration INTEGER NOT NULL, -- Duration in seconds
    ListenCount INTEGER NOT NULL DEFAULT 0,
    AverageRating REAL DEFAULT 0.00, -- Average rating from 1.00 to 5.00
    TotalRatings INTEGER DEFAULT 0, -- Total number of ratings received
    FilePath TEXT NOT NULL,
    FileSize INTEGER NOT NULL, -- File size in bytes
    ReleaseDate TEXT NOT NULL,
    CreatedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    UpdatedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (ArtistID) REFERENCES artist(ArtistID) ON DELETE CASCADE,
    FOREIGN KEY (AlbumID) REFERENCES album(AlbumID) ON DELETE SET NULL,
    FOREIGN KEY (GenreID) REFERENCES genre(GenreID) ON DELETE SET NULL
);

-- Playlist Table
CREATE TABLE playlist (
    PlaylistID INTEGER PRIMARY KEY AUTOINCREMENT,
    PlaylistName TEXT NOT NULL,
    UserID INTEGER NOT NULL,
    Description TEXT,
    IsPublic INTEGER NOT NULL DEFAULT 0,
    CreatedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    UpdatedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE
);

-- Playlist Song Junction Table (Many-to-Many)
CREATE TABLE playlist_song (
    PlaylistID INTEGER NOT NULL,
    SongID INTEGER NOT NULL,
    Position INTEGER NOT NULL,
    AddedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    PRIMARY KEY (PlaylistID, SongID),
    FOREIGN KEY (PlaylistID) REFERENCES playlist(PlaylistID) ON DELETE CASCADE,
    FOREIGN KEY (SongID) REFERENCES song(SongID) ON DELETE CASCADE
);

-- User Follows Artist Table
CREATE TABLE user_follows_artist (
    UserID INTEGER NOT NULL,
    ArtistID INTEGER NOT NULL,
    FollowedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    PRIMARY KEY (UserID, ArtistID),
    FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    FOREIGN KEY (ArtistID) REFERENCES artist(ArtistID) ON DELETE CASCADE
);

-- User Likes Song Table
CREATE TABLE user_likes_song (
    UserID INTEGER NOT NULL,
    SongID INTEGER NOT NULL,
    LikedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    PRIMARY KEY (UserID, SongID),
    FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    FOREIGN KEY (SongID) REFERENCES song(SongID) ON DELETE CASCADE
);

-- User Likes Album Table
CREATE TABLE user_likes_album (
    UserID INTEGER NOT NULL,
    AlbumID INTEGER NOT NULL,
    LikedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    PRIMARY KEY (UserID, AlbumID),
    FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    FOREIGN KEY (AlbumID) REFERENCES album(AlbumID) ON DELETE CASCADE
);

-- User Likes Playlist Table
CREATE TABLE user_likes_playlist (
    UserID INTEGER NOT NULL,
    PlaylistID INTEGER NOT NULL,
    LikedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    PRIMARY KEY (UserID, PlaylistID),
    FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    FOREIGN KEY (PlaylistID) REFERENCES playlist(PlaylistID) ON DELETE CASCADE
);

-- Listening History Table
CREATE TABLE listening_history (
    HistoryID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER NOT NULL,
    SongID INTEGER NOT NULL,
    ListenedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    Duration INTEGER, -- How long they listened (in seconds)
    FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    FOREIGN KEY (SongID) REFERENCES song(SongID) ON DELETE CASCADE
);

-- Song Ratings Table
CREATE TABLE song_ratings (
    UserID INTEGER NOT NULL,
    SongID INTEGER NOT NULL,
    Rating INTEGER NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
    RatedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    UpdatedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    PRIMARY KEY (UserID, SongID),
    FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    FOREIGN KEY (SongID) REFERENCES song(SongID) ON DELETE CASCADE
);

-- Album Ratings Table
CREATE TABLE album_ratings (
    UserID INTEGER NOT NULL,
    AlbumID INTEGER NOT NULL,
    Rating INTEGER NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
    RatedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    UpdatedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    PRIMARY KEY (UserID, AlbumID),
    FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    FOREIGN KEY (AlbumID) REFERENCES album(AlbumID) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_userprofile_username ON userprofile(Username);
CREATE INDEX idx_userprofile_email ON userprofile(Email);
CREATE INDEX idx_userprofile_user_type ON userprofile(UserType);
CREATE INDEX idx_artist_verified ON artist(VerifiedStatus);
CREATE INDEX idx_song_artist ON song(ArtistID);
CREATE INDEX idx_song_album ON song(AlbumID);
CREATE INDEX idx_song_genre ON song(GenreID);
CREATE INDEX idx_playlist_user ON playlist(UserID);
CREATE INDEX idx_playlist_public ON playlist(IsPublic);
CREATE INDEX idx_listening_history_user ON listening_history(UserID);
CREATE INDEX idx_listening_history_song ON listening_history(SongID);
CREATE INDEX idx_listening_history_date ON listening_history(ListenedAt);
CREATE INDEX idx_song_ratings_user ON song_ratings(UserID);
CREATE INDEX idx_song_ratings_song ON song_ratings(SongID);
CREATE INDEX idx_song_ratings_rating ON song_ratings(Rating);
CREATE INDEX idx_album_ratings_user ON album_ratings(UserID);
CREATE INDEX idx_album_ratings_album ON album_ratings(AlbumID);
CREATE INDEX idx_album_ratings_rating ON album_ratings(Rating);

-- Trigger to automatically verify artists when they reach 100 followers
CREATE TRIGGER verify_artist_on_100_followers
AFTER INSERT ON user_follows_artist
BEGIN
    UPDATE artist
    SET VerifiedStatus = 1,
        DateVerified = DATETIME('now'),
        UpdatedAt = DATETIME('now')
    WHERE ArtistID = NEW.ArtistID
        AND VerifiedStatus = 0
        AND (
            SELECT COUNT(*)
            FROM user_follows_artist
            WHERE ArtistID = NEW.ArtistID
        ) >= 100;
END;

-- Trigger to automatically unverify artists when they drop below 100 followers
CREATE TRIGGER unverify_artist_below_100_followers
AFTER DELETE ON user_follows_artist
BEGIN
    UPDATE artist
    SET VerifiedStatus = 0,
        DateVerified = NULL,
        VerifyingAdminID = NULL,
        UpdatedAt = DATETIME('now')
    WHERE ArtistID = OLD.ArtistID
        AND VerifiedStatus = 1
        AND (
            SELECT COUNT(*)
            FROM user_follows_artist
            WHERE ArtistID = OLD.ArtistID
        ) < 100;
END;

-- Trigger to remove song from playlists and other related tables when deleted
CREATE TRIGGER remove_song_from_playlists_on_delete
BEFORE DELETE ON song
BEGIN
    -- Remove song from all playlists
    DELETE FROM playlist_song WHERE SongID = OLD.SongID;
    
    -- Remove all likes for this song (additional safety beyond CASCADE)
    DELETE FROM user_likes_song WHERE SongID = OLD.SongID;
    
    -- Remove from listening history (additional safety beyond CASCADE)
    DELETE FROM listening_history WHERE SongID = OLD.SongID;
    
    -- Note: Album relationship is handled automatically - when the song is deleted,
    -- it's no longer part of any album (since AlbumID is a reference field in the song table)
END;

-- Trigger to delete all songs in an album when the album is deleted
CREATE TRIGGER delete_songs_on_album_delete
BEFORE DELETE ON album
BEGIN
    -- Delete all songs that belong to this album
    -- This trigger will cascade and also trigger the remove_song_from_playlists_on_delete
    -- for each song, ensuring all related data is cleaned up
    DELETE FROM song WHERE AlbumID = OLD.AlbumID;
END;

-- Trigger to add songs to "Hit Songs" playlist when they reach 1 million listens
CREATE TRIGGER add_to_hit_songs_on_million_listens
AFTER UPDATE OF ListenCount ON song
WHEN NEW.ListenCount >= 1000000 AND (OLD.ListenCount IS NULL OR OLD.ListenCount < 1000000)
BEGIN
    -- Ensure "Hit Songs" playlist exists
    -- Create it if it doesn't exist, using an Administrator user or first user
    INSERT INTO playlist (PlaylistName, UserID, Description, IsPublic, CreatedAt, UpdatedAt)
    SELECT 
        'Hit Songs',
        COALESCE(
            (SELECT UserID FROM userprofile WHERE UserType = 'Administrator' LIMIT 1),
            (SELECT UserID FROM userprofile ORDER BY UserID LIMIT 1)
        ),
        'Automatically curated playlist of songs with over 1 million listens',
        1,
        DATETIME('now'),
        DATETIME('now')
    WHERE NOT EXISTS (
        SELECT 1 FROM playlist 
        WHERE PlaylistName = 'Hit Songs' AND IsPublic = 1
    );
    
    -- Add the song to the "Hit Songs" playlist if not already there
    INSERT OR IGNORE INTO playlist_song (PlaylistID, SongID, Position, AddedAt)
    SELECT 
        (SELECT PlaylistID FROM playlist WHERE PlaylistName = 'Hit Songs' AND IsPublic = 1 LIMIT 1),
        NEW.SongID,
        COALESCE(
            (SELECT MAX(Position) + 1 FROM playlist_song 
             WHERE PlaylistID = (SELECT PlaylistID FROM playlist WHERE PlaylistName = 'Hit Songs' AND IsPublic = 1 LIMIT 1)),
            1
        ),
        DATETIME('now');
END;

-- Trigger to update song rating stats after INSERT
CREATE TRIGGER after_song_rating_insert
AFTER INSERT ON song_ratings
BEGIN
    UPDATE song 
    SET 
        TotalRatings = (SELECT COUNT(*) FROM song_ratings WHERE SongID = NEW.SongID),
        AverageRating = (SELECT AVG(Rating) FROM song_ratings WHERE SongID = NEW.SongID)
    WHERE SongID = NEW.SongID;
END;

-- Trigger to update song rating stats after UPDATE
CREATE TRIGGER after_song_rating_update
AFTER UPDATE ON song_ratings
BEGIN
    UPDATE song 
    SET 
        TotalRatings = (SELECT COUNT(*) FROM song_ratings WHERE SongID = NEW.SongID),
        AverageRating = (SELECT AVG(Rating) FROM song_ratings WHERE SongID = NEW.SongID)
    WHERE SongID = NEW.SongID;
END;

-- Trigger to update song rating stats after DELETE
CREATE TRIGGER after_song_rating_delete
AFTER DELETE ON song_ratings
BEGIN
    UPDATE song 
    SET 
        TotalRatings = (SELECT COUNT(*) FROM song_ratings WHERE SongID = OLD.SongID),
        AverageRating = COALESCE((SELECT AVG(Rating) FROM song_ratings WHERE SongID = OLD.SongID), 0.00)
    WHERE SongID = OLD.SongID;
END;

-- Trigger to update album rating stats after INSERT
CREATE TRIGGER after_album_rating_insert
AFTER INSERT ON album_ratings
BEGIN
    UPDATE album 
    SET 
        TotalRatings = (SELECT COUNT(*) FROM album_ratings WHERE AlbumID = NEW.AlbumID),
        AverageRating = (SELECT AVG(Rating) FROM album_ratings WHERE AlbumID = NEW.AlbumID)
    WHERE AlbumID = NEW.AlbumID;
END;

-- Trigger to update album rating stats after UPDATE
CREATE TRIGGER after_album_rating_update
AFTER UPDATE ON album_ratings
BEGIN
    UPDATE album 
    SET 
        TotalRatings = (SELECT COUNT(*) FROM album_ratings WHERE AlbumID = NEW.AlbumID),
        AverageRating = (SELECT AVG(Rating) FROM album_ratings WHERE AlbumID = NEW.AlbumID)
    WHERE AlbumID = NEW.AlbumID;
END;

-- Trigger to update album rating stats after DELETE
CREATE TRIGGER after_album_rating_delete
AFTER DELETE ON album_ratings
BEGIN
    UPDATE album 
    SET 
        TotalRatings = (SELECT COUNT(*) FROM album_ratings WHERE AlbumID = OLD.AlbumID),
        AverageRating = COALESCE((SELECT AVG(Rating) FROM album_ratings WHERE AlbumID = OLD.AlbumID), 0.00)
    WHERE AlbumID = OLD.AlbumID;
END;

-- Insert default genres
INSERT INTO genre (GenreName, Description) VALUES
('Pop', 'Popular music characterized by catchy melodies and broad appeal'),
('Rock', 'Music characterized by amplified instruments and strong rhythms'),
('Hip-Hop', 'Music featuring rhythmic speech and beats'),
('Electronic', 'Music created using electronic instruments and technology'),
('Dance', 'A broad category of music designed primarily for dancing, characterized by a strong, often repetitive rhythm and beat'),
('House', 'A sub-genre of electronic dance music defined by its repetitive, four-on-the-floor beat, typically between 115–130 beats per minute'),
('Dubstep', 'A form of dance music, typically instrumental, characterized by a sparse, syncopated rhythm and a strong bassline'),
('Jazz', 'Music characterized by improvisation and complex harmonies'),
('Blues', 'a music genre and form originating in African American communities in the Deep South of the U.S. in the late 19th century, 
characterized by a 12-bar chord progression, a call-and-response pattern, and the use of "blue notes"'),
('Classical', 'Traditional Western art music'),
('Country', 'Music originating from rural America with folk influences'),
('R&B/Soul', 'Rhythm and Blues music with soulful vocals'),
('Alternative', 'Non-mainstream music that challenges conventional styles'),
('Folk', 'Traditional music passed down through generations'),
('Ambient', 'A style of gentle, largely electronic instrumental music with no persistent beat, used to create or enhance a mood or atmosphere.'),
('Metal', 'Characterized by distorted guitars, loud and aggressive drumming, powerful vocals, and a heavy sound'),
('Reggae', 'Jamaican popular music genre that combines elements of blues, calypso, and rock-n-roll, characterized
 by a strong syncopated offbeat rhythm and often featuring lyrics of social protest, love, and unity');