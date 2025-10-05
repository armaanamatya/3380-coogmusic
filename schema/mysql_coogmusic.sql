-- CoogMusic MySQL schema (MySQL 8.0+ recommended)
-- Charset/engine
CREATE DATABASE IF NOT EXISTS coogmusic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE coogmusic;

-- Drop tables in reverse dependency order for idempotency
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS HistorySong;
DROP TABLE IF EXISTS PlaylistSong;
DROP TABLE IF EXISTS LikedSong;
DROP TABLE IF EXISTS UserFollows;
DROP TABLE IF EXISTS Rating;
DROP TABLE IF EXISTS Likes;
DROP TABLE IF EXISTS History;
DROP TABLE IF EXISTS Playlist;
DROP TABLE IF EXISTS Song;
DROP TABLE IF EXISTS Album;
DROP TABLE IF EXISTS Artist;
DROP TABLE IF EXISTS Genre;
DROP TABLE IF EXISTS `User`;
SET FOREIGN_KEY_CHECKS = 1;

-- User
CREATE TABLE `User` (
  UserID INT PRIMARY KEY AUTO_INCREMENT,
  Username VARCHAR(30) NOT NULL UNIQUE,
  UserPassword VARCHAR(255) NOT NULL,
  FirstName VARCHAR(30) NOT NULL,
  LastName VARCHAR(30) NOT NULL,
  DateOfBirth DATE NOT NULL,
  Email VARCHAR(255) NOT NULL UNIQUE,
  UserType ENUM('Listener','Administrator','Artist','Developer') NOT NULL,
  DateJoined DATE NOT NULL,
  Country VARCHAR(30) NOT NULL,
  City VARCHAR(30),
  IsOnline BOOLEAN NOT NULL DEFAULT FALSE,
  AccountStatus ENUM('Active','Suspended','Banned') NOT NULL DEFAULT 'Active',
  -- Basic format constraints (MySQL 8.0+). Adjust as needed per project rules.
  CONSTRAINT chk_username_chars CHECK (Username REGEXP '^[A-Za-z0-9_]+$'),
  CONSTRAINT chk_firstname_chars CHECK (FirstName REGEXP '^[A-Za-z0-9_ ]+$'),
  CONSTRAINT chk_lastname_chars CHECK (LastName REGEXP '^[A-Za-z0-9_ ]+$'),
  CONSTRAINT chk_email_format CHECK (Email REGEXP '^[^@\n]+@[^@\n]+\.[^@\n]+$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Artist (1:0..1 with User). Shares key with UserID.
CREATE TABLE Artist (
  ArtistID INT PRIMARY KEY,
  ArtistBio VARCHAR(275),
  ArtistPFP LONGBLOB,
  VerifiedStatus BOOLEAN NOT NULL DEFAULT FALSE,
  VerifyingAdminID INT NOT NULL,
  DateVerified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_artist_user FOREIGN KEY (ArtistID) REFERENCES `User`(UserID) ON DELETE CASCADE,
  CONSTRAINT fk_artist_verifier FOREIGN KEY (VerifyingAdminID) REFERENCES `User`(UserID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Genre
CREATE TABLE Genre (
  GenreID INT PRIMARY KEY AUTO_INCREMENT,
  GenreName VARCHAR(30) NOT NULL UNIQUE,
  GenreDescription VARCHAR(275)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Album
CREATE TABLE Album (
  AlbumID INT PRIMARY KEY AUTO_INCREMENT,
  ArtistID INT NOT NULL,
  AlbumName VARCHAR(30) NOT NULL,
  AlbumArt LONGBLOB,
  AlbumDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  AlbumType ENUM('Single','EP','Album') NOT NULL,
  AlbumDescription VARCHAR(275),
  GenreID INT,
  CONSTRAINT fk_album_artist FOREIGN KEY (ArtistID) REFERENCES Artist(ArtistID) ON DELETE CASCADE,
  CONSTRAINT fk_album_genre FOREIGN KEY (GenreID) REFERENCES Genre(GenreID),
  CONSTRAINT uq_album_per_artist UNIQUE (ArtistID, AlbumName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Song / Track
CREATE TABLE Song (
  SongID INT PRIMARY KEY AUTO_INCREMENT,
  SongLength INT NOT NULL,
  SongName VARCHAR(50) NOT NULL,
  GenreID INT,
  AlbumID INT,
  Listens INT NOT NULL DEFAULT 0,
  SongFile LONGBLOB,
  FileFormat VARCHAR(10),
  FileSize BIGINT,
  Explicit BOOLEAN NOT NULL DEFAULT FALSE,
  TrackNumber INT NOT NULL,
  CopyRightInfo VARCHAR(275),
  CONSTRAINT fk_song_genre FOREIGN KEY (GenreID) REFERENCES Genre(GenreID),
  CONSTRAINT fk_song_album FOREIGN KEY (AlbumID) REFERENCES Album(AlbumID) ON DELETE SET NULL,
  CONSTRAINT chk_song_length CHECK (SongLength > 0 AND SongLength < 3600),
  CONSTRAINT chk_listens_nonneg CHECK (Listens >= 0),
  CONSTRAINT chk_filesize_nonneg CHECK (FileSize IS NULL OR FileSize >= 0),
  CONSTRAINT uq_track_per_album UNIQUE (AlbumID, TrackNumber),
  CONSTRAINT chk_songname_chars CHECK (SongName REGEXP '^[^\\/:*?\"<>|]+$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Playlist
CREATE TABLE Playlist (
  PlaylistID INT PRIMARY KEY AUTO_INCREMENT,
  UserID INT NOT NULL,
  PlaylistName VARCHAR(50) NOT NULL,
  PlaylistDescription VARCHAR(275),
  PublicPlaylist BOOLEAN NOT NULL DEFAULT TRUE,
  PlaylistImage LONGBLOB,
  DateCreated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Shuffle BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_playlist_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- History (1:1 with User)
CREATE TABLE History (
  HistoryID INT PRIMARY KEY AUTO_INCREMENT,
  UserID INT NOT NULL UNIQUE,
  CONSTRAINT fk_history_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Likes (1:1 with User)
CREATE TABLE Likes (
  LikesID INT PRIMARY KEY AUTO_INCREMENT,
  UserID INT NOT NULL UNIQUE,
  CONSTRAINT fk_likes_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Rating
CREATE TABLE Rating (
  RatingID INT PRIMARY KEY AUTO_INCREMENT,
  UserID INT NOT NULL,
  RatingValue DECIMAL(2,1) NOT NULL,
  RatingDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  RatingDescription VARCHAR(275),
  RateType ENUM('Song','Playlist','Album','Artist') NOT NULL,
  RatedTypeID INT NOT NULL,
  CONSTRAINT fk_rating_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON DELETE CASCADE,
  CONSTRAINT chk_rating_value CHECK (RatingValue >= 0.0 AND RatingValue <= 5.0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- UserFollows (User follows Artist)
CREATE TABLE UserFollows (
  FollowerID INT NOT NULL,
  ArtistID INT NOT NULL,
  DateFollowed DATE NOT NULL,
  PRIMARY KEY (FollowerID, ArtistID),
  CONSTRAINT fk_follows_user FOREIGN KEY (FollowerID) REFERENCES `User`(UserID) ON DELETE CASCADE,
  CONSTRAINT fk_follows_artist FOREIGN KEY (ArtistID) REFERENCES Artist(ArtistID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- LikedSong (Likes to Song)
CREATE TABLE LikedSong (
  LikesID INT NOT NULL,
  SongID INT NOT NULL,
  TimeLiked TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  LikedPosition INT,
  PRIMARY KEY (LikesID, SongID),
  CONSTRAINT fk_likedsong_likes FOREIGN KEY (LikesID) REFERENCES Likes(LikesID) ON DELETE CASCADE,
  CONSTRAINT fk_likedsong_song FOREIGN KEY (SongID) REFERENCES Song(SongID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- PlaylistSong (Playlist to Song)
CREATE TABLE PlaylistSong (
  PlaylistID INT NOT NULL,
  SongID INT NOT NULL,
  TimeAdded TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PlaylistPosition INT,
  PRIMARY KEY (PlaylistID, SongID),
  CONSTRAINT fk_playlistsong_playlist FOREIGN KEY (PlaylistID) REFERENCES Playlist(PlaylistID) ON DELETE CASCADE,
  CONSTRAINT fk_playlistsong_song FOREIGN KEY (SongID) REFERENCES Song(SongID) ON DELETE CASCADE,
  CONSTRAINT uq_position_per_playlist UNIQUE (PlaylistID, PlaylistPosition)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- HistorySong (History to Song)
CREATE TABLE HistorySong (
  SongID INT NOT NULL,
  HistoryID INT NOT NULL,
  TimeListened TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  HistoryPosition INT,
  PRIMARY KEY (SongID, HistoryID, TimeListened),
  CONSTRAINT fk_historysong_song FOREIGN KEY (SongID) REFERENCES Song(SongID) ON DELETE CASCADE,
  CONSTRAINT fk_historysong_history FOREIGN KEY (HistoryID) REFERENCES History(HistoryID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Optional helper: enforce a single History and Likes row per User via triggers could be added if needed.

-- Polymorphic Rating target note:
-- Application should ensure (RateType, RatedTypeID) points to existing entity.


