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
    UserType ENUM('Listener', 'Artist', 'Administrator', 'Developer') NOT NULL DEFAULT 'Listener',
    DateJoined DATE NOT NULL DEFAULT (CURRENT_DATE),
    Country VARCHAR(100) NOT NULL,
    City VARCHAR(100),
    AccountStatus ENUM('Active', 'Suspended', 'Banned') NOT NULL DEFAULT 'Active',
    IsOnline TINYINT(1) NOT NULL DEFAULT 0,
    LastLogin DATETIME,
    ProfilePicture VARCHAR(255),
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
    AlbumCover VARCHAR(255),
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

