-- SQLite version of coogmusic database schema
-- Converted from MySQL dump

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Table: user
CREATE TABLE user (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    Username VARCHAR(30) NOT NULL UNIQUE,
    UserPassword VARCHAR(255) NOT NULL,
    FirstName VARCHAR(30) NOT NULL,
    LastName VARCHAR(30) NOT NULL,
    DateOfBirth DATE NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    UserType VARCHAR(20) NOT NULL CHECK (UserType IN ('Listener', 'Administrator', 'Artist', 'Developer')),
    DateJoined DATE NOT NULL,
    Country VARCHAR(30) NOT NULL,
    City VARCHAR(30),
    IsOnline BOOLEAN NOT NULL DEFAULT 0,
    AccountStatus VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (AccountStatus IN ('Active', 'Suspended', 'Banned')),
    CHECK (Email LIKE '%@%.%'),
    CHECK (FirstName GLOB '[A-Za-z0-9_ ]*'),
    CHECK (LastName GLOB '[A-Za-z0-9_ ]*'),
    CHECK (Username GLOB '[A-Za-z0-9_]*')
);

-- Table: genre
CREATE TABLE genre (
    GenreID INTEGER PRIMARY KEY AUTOINCREMENT,
    GenreName VARCHAR(30) NOT NULL UNIQUE,
    GenreDescription VARCHAR(275)
);

-- Table: artist
CREATE TABLE artist (
    ArtistID INTEGER NOT NULL,
    ArtistBio VARCHAR(275),
    ArtistPFP BLOB,
    VerifiedStatus BOOLEAN NOT NULL DEFAULT 0,
    VerifyingAdminID INTEGER,
    DateVerified TIMESTAMP,
    PRIMARY KEY (ArtistID),
    FOREIGN KEY (ArtistID) REFERENCES user(UserID) ON DELETE CASCADE,
    FOREIGN KEY (VerifyingAdminID) REFERENCES user(UserID)
);

-- Table: album
CREATE TABLE album (
    AlbumID INTEGER PRIMARY KEY AUTOINCREMENT,
    ArtistID INTEGER NOT NULL,
    AlbumName VARCHAR(30) NOT NULL,
    AlbumArt BLOB,
    AlbumDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    AlbumType VARCHAR(10) NOT NULL CHECK (AlbumType IN ('Single', 'EP', 'Album')),
    AlbumDescription VARCHAR(275),
    GenreID INTEGER,
    UNIQUE (ArtistID, AlbumName),
    FOREIGN KEY (ArtistID) REFERENCES artist(ArtistID) ON DELETE CASCADE,
    FOREIGN KEY (GenreID) REFERENCES genre(GenreID)
);

-- Table: song
CREATE TABLE song (
    SongID INTEGER PRIMARY KEY AUTOINCREMENT,
    SongLength INTEGER NOT NULL CHECK (SongLength > 0 AND SongLength < 3600),
    SongName VARCHAR(50) NOT NULL,
    GenreID INTEGER,
    AlbumID INTEGER,
    Listens INTEGER NOT NULL DEFAULT 0 CHECK (Listens >= 0),
    SongFile BLOB,
    FileFormat VARCHAR(10),
    FileSize BIGINT CHECK (FileSize IS NULL OR FileSize >= 0),
    Explicit BOOLEAN NOT NULL DEFAULT 0,
    TrackNumber INTEGER DEFAULT 1,
    CopyRightInfo VARCHAR(275),
    UNIQUE (AlbumID, TrackNumber),
    FOREIGN KEY (GenreID) REFERENCES genre(GenreID),
    FOREIGN KEY (AlbumID) REFERENCES album(AlbumID) ON DELETE SET NULL,
    CHECK (SongName NOT GLOB '*[/:*?"<>|]*')
);

-- Table: history
CREATE TABLE history (
    HistoryID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER NOT NULL UNIQUE,
    FOREIGN KEY (UserID) REFERENCES user(UserID) ON DELETE CASCADE
);

-- Table: historysong
CREATE TABLE historysong (
    SongID INTEGER NOT NULL,
    HistoryID INTEGER NOT NULL,
    TimeListened TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    HistoryPosition INTEGER,
    PRIMARY KEY (SongID, HistoryID, TimeListened),
    FOREIGN KEY (SongID) REFERENCES song(SongID) ON DELETE CASCADE,
    FOREIGN KEY (HistoryID) REFERENCES history(HistoryID) ON DELETE CASCADE
);

-- Table: likes
CREATE TABLE likes (
    LikesID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER NOT NULL UNIQUE,
    FOREIGN KEY (UserID) REFERENCES user(UserID) ON DELETE CASCADE
);

-- Table: likedsong
CREATE TABLE likedsong (
    LikesID INTEGER NOT NULL,
    SongID INTEGER NOT NULL,
    TimeLiked TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LikedPosition INTEGER,
    PRIMARY KEY (LikesID, SongID),
    FOREIGN KEY (LikesID) REFERENCES likes(LikesID) ON DELETE CASCADE,
    FOREIGN KEY (SongID) REFERENCES song(SongID) ON DELETE CASCADE
);

-- Table: playlist
CREATE TABLE playlist (
    PlaylistID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER NOT NULL,
    PlaylistName VARCHAR(50) NOT NULL,
    PlaylistDescription VARCHAR(275),
    PublicPlaylist BOOLEAN NOT NULL DEFAULT 1,
    PlaylistImage BLOB,
    DateCreated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Shuffle BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY (UserID) REFERENCES user(UserID) ON DELETE CASCADE
);

-- Table: playlistsong
CREATE TABLE playlistsong (
    PlaylistID INTEGER NOT NULL,
    SongID INTEGER NOT NULL,
    TimeAdded TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PlaylistPosition INTEGER,
    PRIMARY KEY (PlaylistID, SongID),
    UNIQUE (PlaylistID, PlaylistPosition),
    FOREIGN KEY (PlaylistID) REFERENCES playlist(PlaylistID) ON DELETE CASCADE,
    FOREIGN KEY (SongID) REFERENCES song(SongID) ON DELETE CASCADE
);

-- Table: rating
CREATE TABLE rating (
    RatingID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER NOT NULL,
    RatingValue DECIMAL(2,1) NOT NULL CHECK (RatingValue >= 0.0 AND RatingValue <= 5.0),
    RatingDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    RatingDescription VARCHAR(275),
    RateType VARCHAR(20) NOT NULL CHECK (RateType IN ('Song', 'Playlist', 'Album', 'Artist')),
    RatedTypeID INTEGER NOT NULL,
    FOREIGN KEY (UserID) REFERENCES user(UserID) ON DELETE CASCADE
);

-- Table: userfollows
CREATE TABLE userfollows (
    FollowerID INTEGER NOT NULL,
    ArtistID INTEGER NOT NULL,
    DateFollowed DATE NOT NULL,
    PRIMARY KEY (FollowerID, ArtistID),
    FOREIGN KEY (FollowerID) REFERENCES user(UserID) ON DELETE CASCADE,
    FOREIGN KEY (ArtistID) REFERENCES artist(ArtistID) ON DELETE CASCADE
);
