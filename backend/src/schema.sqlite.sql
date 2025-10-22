-- CoogMusic Database Schema
-- This schema supports a music streaming platform with users, artists, genres, albums, songs, and playlists

-- User Profile Table
CREATE TABLE userprofile (
    UserID INTEGER PRIMARY KEY AUTO_INCREMENT,
    Username VARCHAR(30) NOT NULL UNIQUE,
    UserPassword VARCHAR(255) NOT NULL,
    FirstName VARCHAR(30) NOT NULL,
    LastName VARCHAR(30) NOT NULL,
    DateOfBirth DATE NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    UserType ENUM('Listener', 'Artist', 'Administrator', 'Developer') NOT NULL DEFAULT 'Listener',
    DateJoined DATE NOT NULL DEFAULT (CURRENT_DATE),
    Country VARCHAR(30) NOT NULL,
    City VARCHAR(30),
    AccountStatus ENUM('Active', 'Suspended', 'Banned') NOT NULL DEFAULT 'Active',
    IsOnline BOOLEAN NOT NULL DEFAULT FALSE,
    LastLogin TIMESTAMP NULL,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Artist Profile Table (extends user profile)
CREATE TABLE artist (
    ArtistID INTEGER PRIMARY KEY,
    ArtistBio TEXT,
    ArtistPFP LONGBLOB,
    VerifiedStatus BOOLEAN NOT NULL DEFAULT FALSE,
    VerifyingAdminID INTEGER,
    DateVerified TIMESTAMP NULL,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ArtistID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    FOREIGN KEY (VerifyingAdminID) REFERENCES userprofile(UserID) ON DELETE SET NULL
);

-- Genre Table
CREATE TABLE genre (
    GenreID INTEGER PRIMARY KEY AUTO_INCREMENT,
    GenreName VARCHAR(50) NOT NULL UNIQUE,
    Description TEXT,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Album Table
CREATE TABLE album (
    AlbumID INTEGER PRIMARY KEY AUTO_INCREMENT,
    AlbumName VARCHAR(100) NOT NULL,
    ArtistID INTEGER NOT NULL,
    ReleaseDate DATE NOT NULL,
    AlbumCover LONGBLOB,
    Description TEXT,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ArtistID) REFERENCES artist(ArtistID) ON DELETE CASCADE
);

-- Song Table
CREATE TABLE song (
    SongID INTEGER PRIMARY KEY AUTO_INCREMENT,
    SongName VARCHAR(100) NOT NULL,
    ArtistID INTEGER NOT NULL,
    AlbumID INTEGER,
    GenreID INTEGER,
    Duration INTEGER NOT NULL, -- Duration in seconds
    ListenCount INTEGER NOT NULL DEFAULT 0,
    FilePath VARCHAR(500) NOT NULL,
    FileSize BIGINT NOT NULL, -- File size in bytes
    ReleaseDate DATE NOT NULL,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ArtistID) REFERENCES artist(ArtistID) ON DELETE CASCADE,
    FOREIGN KEY (AlbumID) REFERENCES album(AlbumID) ON DELETE SET NULL,
    FOREIGN KEY (GenreID) REFERENCES genre(GenreID) ON DELETE SET NULL
);

-- Playlist Table
CREATE TABLE playlist (
    PlaylistID INTEGER PRIMARY KEY AUTO_INCREMENT,
    PlaylistName VARCHAR(100) NOT NULL,
    UserID INTEGER NOT NULL,
    Description TEXT,
    IsPublic BOOLEAN NOT NULL DEFAULT FALSE,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE
);

-- Playlist Song Junction Table (Many-to-Many)
CREATE TABLE playlist_song (
    PlaylistID INTEGER NOT NULL,
    SongID INTEGER NOT NULL,
    Position INTEGER NOT NULL,
    AddedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (PlaylistID, SongID),
    FOREIGN KEY (PlaylistID) REFERENCES playlist(PlaylistID) ON DELETE CASCADE,
    FOREIGN KEY (SongID) REFERENCES song(SongID) ON DELETE CASCADE
);

-- User Follows Artist Table
CREATE TABLE user_follows_artist (
    UserID INTEGER NOT NULL,
    ArtistID INTEGER NOT NULL,
    FollowedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UserID, ArtistID),
    FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    FOREIGN KEY (ArtistID) REFERENCES artist(ArtistID) ON DELETE CASCADE
);

-- User Likes Song Table
CREATE TABLE user_likes_song (
    UserID INTEGER NOT NULL,
    SongID INTEGER NOT NULL,
    LikedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UserID, SongID),
    FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    FOREIGN KEY (SongID) REFERENCES song(SongID) ON DELETE CASCADE
);

-- User Likes Album Table
CREATE TABLE user_likes_album (
    UserID INTEGER NOT NULL,
    AlbumID INTEGER NOT NULL,
    LikedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UserID, AlbumID),
    FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    FOREIGN KEY (AlbumID) REFERENCES album(AlbumID) ON DELETE CASCADE
);

-- User Likes Playlist Table
CREATE TABLE user_likes_playlist (
    UserID INTEGER NOT NULL,
    PlaylistID INTEGER NOT NULL,
    LikedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UserID, PlaylistID),
    FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    FOREIGN KEY (PlaylistID) REFERENCES playlist(PlaylistID) ON DELETE CASCADE
);

-- Listening History Table
CREATE TABLE listening_history (
    HistoryID INTEGER PRIMARY KEY AUTO_INCREMENT,
    UserID INTEGER NOT NULL,
    SongID INTEGER NOT NULL,
    ListenedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Duration INTEGER, -- How long they listened (in seconds)
    FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
    FOREIGN KEY (SongID) REFERENCES song(SongID) ON DELETE CASCADE
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
