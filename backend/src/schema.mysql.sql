-- CoogMusic Database Schema - MySQL Version
-- This schema supports a music streaming platform with users, artists, genres, albums, songs, and playlists

-- User Profile Table
CREATE TABLE IF NOT EXISTS userprofile (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    UserPassword VARCHAR(255) NOT NULL,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    DateOfBirth DATE NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    UserType ENUM('Listener', 'Artist', 'Administrator', 'Analyst') NOT NULL DEFAULT 'Listener',
    DateJoined DATE NOT NULL DEFAULT (CURRENT_DATE),
    Country VARCHAR(100) NOT NULL,
    City VARCHAR(100),
    AccountStatus ENUM('Active', 'Suspended', 'Banned') NOT NULL DEFAULT 'Active',
    IsOnline TINYINT(1) NOT NULL DEFAULT 0,
    LastLogin DATETIME,
    ProfilePicture LONGBLOB,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (Username),
    INDEX idx_email (Email),
    INDEX idx_user_type (UserType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Artist Profile Table (extends user profile)
CREATE TABLE IF NOT EXISTS artist (
    ArtistID INT PRIMARY KEY,
    ArtistBio TEXT,
    ArtistPFP LONGBLOB,
    VerifiedStatus TINYINT(1) NOT NULL DEFAULT 0,
    VerifyingAdminID INT,
    DateVerified DATE,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ArtistID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    FOREIGN KEY (VerifyingAdminID) REFERENCES userprofile(UserID) ON DELETE SET NULL,
    INDEX idx_verified (VerifiedStatus)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Genre Table
CREATE TABLE IF NOT EXISTS genre (
    GenreID INT AUTO_INCREMENT PRIMARY KEY,
    GenreName VARCHAR(100) NOT NULL UNIQUE,
    Description TEXT,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Album Table
CREATE TABLE IF NOT EXISTS album (
    AlbumID INT AUTO_INCREMENT PRIMARY KEY,
    AlbumName VARCHAR(255) NOT NULL,
    ArtistID INT NOT NULL,
    ReleaseDate DATE NOT NULL,
    AlbumCover LONGBLOB,
    Description TEXT,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ArtistID) REFERENCES artist(ArtistID) ON DELETE CASCADE,
    INDEX idx_artist (ArtistID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Song Table
CREATE TABLE IF NOT EXISTS song (
    SongID INT AUTO_INCREMENT PRIMARY KEY,
    SongName VARCHAR(255) NOT NULL,
    ArtistID INT NOT NULL,
    AlbumID INT,
    GenreID INT,
    Duration INT NOT NULL, -- Duration in seconds
    ListenCount INT NOT NULL DEFAULT 0,
    AverageRating DECIMAL(3,2) DEFAULT 0.00, -- Average rating from 1.00 to 5.00
    TotalRatings INT DEFAULT 0, -- Total number of ratings received
    FilePath VARCHAR(500) NOT NULL,
    FileSize BIGINT NOT NULL, -- File size in bytes
    ReleaseDate DATE NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ArtistID) REFERENCES artist(ArtistID) ON DELETE CASCADE,
    FOREIGN KEY (AlbumID) REFERENCES album(AlbumID) ON DELETE SET NULL,
    FOREIGN KEY (GenreID) REFERENCES genre(GenreID) ON DELETE SET NULL,
    INDEX idx_song_artist (ArtistID),
    INDEX idx_song_album (AlbumID),
    INDEX idx_song_genre (GenreID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Playlist Table
CREATE TABLE IF NOT EXISTS playlist (
    PlaylistID INT AUTO_INCREMENT PRIMARY KEY,
    PlaylistName VARCHAR(255) NOT NULL,
    UserID INT NOT NULL,
    Description TEXT,
    IsPublic TINYINT(1) NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    INDEX idx_playlist_user (UserID),
    INDEX idx_playlist_public (IsPublic)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Playlist Song Junction Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS playlist_song (
    PlaylistID INT NOT NULL,
    SongID INT NOT NULL,
    Position INT NOT NULL,
    AddedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (PlaylistID, SongID),
    FOREIGN KEY (PlaylistID) REFERENCES playlist(PlaylistID) ON DELETE CASCADE,
    FOREIGN KEY (SongID) REFERENCES song(SongID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Follows Artist Table
CREATE TABLE IF NOT EXISTS user_follows_artist (
    UserID INT NOT NULL,
    ArtistID INT NOT NULL,
    FollowedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UserID, ArtistID),
    FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    FOREIGN KEY (ArtistID) REFERENCES artist(ArtistID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Likes Song Table
CREATE TABLE IF NOT EXISTS user_likes_song (
    UserID INT NOT NULL,
    SongID INT NOT NULL,
    LikedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UserID, SongID),
    FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    FOREIGN KEY (SongID) REFERENCES song(SongID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Likes Album Table
CREATE TABLE IF NOT EXISTS user_likes_album (
    UserID INT NOT NULL,
    AlbumID INT NOT NULL,
    LikedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UserID, AlbumID),
    FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    FOREIGN KEY (AlbumID) REFERENCES album(AlbumID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Likes Playlist Table
CREATE TABLE IF NOT EXISTS user_likes_playlist (
    UserID INT NOT NULL,
    PlaylistID INT NOT NULL,
    LikedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UserID, PlaylistID),
    FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    FOREIGN KEY (PlaylistID) REFERENCES playlist(PlaylistID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listening History Table
CREATE TABLE IF NOT EXISTS listening_history (
    HistoryID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    SongID INT NOT NULL,
    ListenedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Duration INT, -- How long they listened (in seconds)
    FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    FOREIGN KEY (SongID) REFERENCES song(SongID) ON DELETE CASCADE,
    INDEX idx_listening_history_user (UserID),
    INDEX idx_listening_history_song (SongID),
    INDEX idx_listening_history_date (ListenedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Song Ratings Table
CREATE TABLE IF NOT EXISTS song_ratings (
    UserID INT NOT NULL,
    SongID INT NOT NULL,
    Rating TINYINT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
    RatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (UserID, SongID),
    FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    FOREIGN KEY (SongID) REFERENCES song(SongID) ON DELETE CASCADE,
    INDEX idx_song_ratings_user (UserID),
    INDEX idx_song_ratings_song (SongID),
    INDEX idx_song_ratings_rating (Rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Triggers for automatic rating statistics updates
DELIMITER $$

-- Trigger to update song rating stats after INSERT
CREATE TRIGGER IF NOT EXISTS after_rating_insert
AFTER INSERT ON song_ratings
FOR EACH ROW
BEGIN
    UPDATE song 
    SET 
        TotalRatings = (SELECT COUNT(*) FROM song_ratings WHERE SongID = NEW.SongID),
        AverageRating = (SELECT AVG(Rating) FROM song_ratings WHERE SongID = NEW.SongID)
    WHERE SongID = NEW.SongID;
END$$

-- Trigger to update song rating stats after UPDATE
CREATE TRIGGER IF NOT EXISTS after_rating_update
AFTER UPDATE ON song_ratings
FOR EACH ROW
BEGIN
    UPDATE song 
    SET 
        TotalRatings = (SELECT COUNT(*) FROM song_ratings WHERE SongID = NEW.SongID),
        AverageRating = (SELECT AVG(Rating) FROM song_ratings WHERE SongID = NEW.SongID)
    WHERE SongID = NEW.SongID;
END$$

-- Trigger to update song rating stats after DELETE
CREATE TRIGGER IF NOT EXISTS after_rating_delete
AFTER DELETE ON song_ratings
FOR EACH ROW
BEGIN
    UPDATE song 
    SET 
        TotalRatings = (SELECT COUNT(*) FROM song_ratings WHERE SongID = OLD.SongID),
        AverageRating = COALESCE((SELECT AVG(Rating) FROM song_ratings WHERE SongID = OLD.SongID), 0.00)
    WHERE SongID = OLD.SongID;
END$$

DELIMITER ;

-- Trigger to automatically verify artists when they reach 100 followers
DELIMITER $$

CREATE TRIGGER verify_artist_on_100_followers
AFTER INSERT ON user_follows_artist
FOR EACH ROW
BEGIN
    UPDATE artist
    SET VerifiedStatus = 1,
        DateVerified = NOW(),
        UpdatedAt = NOW()
    WHERE ArtistID = NEW.ArtistID
        AND VerifiedStatus = 0
        AND (
            SELECT COUNT(*)
            FROM user_follows_artist
            WHERE ArtistID = NEW.ArtistID
        ) >= 100;
END$$

-- Trigger to automatically unverify artists when they drop below 100 followers
CREATE TRIGGER unverify_artist_below_100_followers
AFTER DELETE ON user_follows_artist
FOR EACH ROW
BEGIN
    UPDATE artist
    SET VerifiedStatus = 0,
        DateVerified = NULL,
        VerifyingAdminID = NULL,
        UpdatedAt = NOW()
    WHERE ArtistID = OLD.ArtistID
        AND VerifiedStatus = 1
        AND (
            SELECT COUNT(*)
            FROM user_follows_artist
            WHERE ArtistID = OLD.ArtistID
        ) < 100;
END$$

-- Trigger to remove song from playlists and other related tables when deleted
CREATE TRIGGER remove_song_from_playlists_on_delete
BEFORE DELETE ON song
FOR EACH ROW
BEGIN
    -- Remove song from all playlists
    DELETE FROM playlist_song WHERE SongID = OLD.SongID;
    
    -- Remove all likes for this song (additional safety beyond CASCADE)
    DELETE FROM user_likes_song WHERE SongID = OLD.SongID;
    
    -- Remove from listening history (additional safety beyond CASCADE)
    DELETE FROM listening_history WHERE SongID = OLD.SongID;
    
    -- Note: Album relationship is handled automatically - when the song is deleted,
    -- it's no longer part of any album (since AlbumID is a reference field in the song table)
END$$

-- Trigger to delete all songs in an album when the album is deleted
CREATE TRIGGER delete_songs_on_album_delete
BEFORE DELETE ON album
FOR EACH ROW
BEGIN
    -- Delete all songs that belong to this album
    -- This trigger will cascade and also trigger the remove_song_from_playlists_on_delete
    -- for each song, ensuring all related data is cleaned up
    DELETE FROM song WHERE AlbumID = OLD.AlbumID;
END$$

-- Trigger to add songs to "Hit Songs" playlist when they reach 1 million listens
CREATE TRIGGER add_to_hit_songs_on_million_listens
AFTER UPDATE ON song
FOR EACH ROW
BEGIN
    -- Only trigger when ListenCount crosses the 1 million threshold
    IF NEW.ListenCount >= 1000000 AND (OLD.ListenCount IS NULL OR OLD.ListenCount < 1000000) THEN
        -- Get or create "Hit Songs" playlist
        -- First, try to find an existing "Hit Songs" playlist that is public
        -- If not found, create one using the first Administrator user, or first user if no admin exists
        INSERT IGNORE INTO playlist (PlaylistName, UserID, Description, IsPublic, CreatedAt, UpdatedAt)
        SELECT 
            'Hit Songs',
            COALESCE(
                (SELECT UserID FROM userprofile WHERE UserType = 'Administrator' LIMIT 1),
                (SELECT UserID FROM userprofile ORDER BY UserID LIMIT 1)
            ),
            'Automatically curated playlist of songs with over 1 million listens',
            1,
            NOW(),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM playlist 
            WHERE PlaylistName = 'Hit Songs' AND IsPublic = 1
        );
        
        -- Add the song to the playlist if not already there
        INSERT IGNORE INTO playlist_song (PlaylistID, SongID, Position, AddedAt)
        SELECT 
            (SELECT PlaylistID FROM playlist WHERE PlaylistName = 'Hit Songs' AND IsPublic = 1 LIMIT 1),
            NEW.SongID,
            COALESCE(
                (SELECT MAX(Position) + 1 FROM playlist_song 
                 WHERE PlaylistID = (SELECT PlaylistID FROM playlist WHERE PlaylistName = 'Hit Songs' AND IsPublic = 1 LIMIT 1)),
                1
            ),
            NOW();
    END IF;
END$$

DELIMITER ;

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
('Blues', 'a music genre and form originating in African American communities in the Deep South of the U.S. in the late 19th century, characterized by a 12-bar chord progression, a call-and-response pattern, and the use of "blue notes"'),
('Classical', 'Traditional Western art music'),
('Country', 'Music originating from rural America with folk influences'),
('R&B/Soul', 'Rhythm and Blues music with soulful vocals'),
('Alternative', 'Non-mainstream music that challenges conventional styles'),
('Folk', 'Traditional music passed down through generations'),
('Ambient', 'A style of gentle, largely electronic instrumental music with no persistent beat, used to create or enhance a mood or atmosphere.'),
('Metal', 'Characterized by distorted guitars, loud and aggressive drumming, powerful vocals, and a heavy sound'),
('Reggae', 'Jamaican popular music genre that combines elements of blues, calypso, and rock-n-roll, characterized by a strong syncopated offbeat rhythm and often featuring lyrics of social protest, love, and unity')
ON DUPLICATE KEY UPDATE Description = VALUES(Description);

