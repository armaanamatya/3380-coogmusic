-- MySQL dump 10.13  Distrib 8.4.6, for Win64 (x86_64)
--
-- Host: localhost    Database: coogmusic
-- ------------------------------------------------------
-- Server version	8.4.6

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `coogmusic`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `coogmusic` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `coogmusic`;

--
-- Table structure for table `album`
--

DROP TABLE IF EXISTS `album`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `album` (
  `AlbumID` int NOT NULL AUTO_INCREMENT,
  `ArtistID` int NOT NULL,
  `AlbumName` varchar(30) NOT NULL,
  `AlbumArt` longblob,
  `AlbumDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `AlbumType` enum('Single','EP','Album') NOT NULL,
  `AlbumDescription` varchar(275) DEFAULT NULL,
  `GenreID` int DEFAULT NULL,
  PRIMARY KEY (`AlbumID`),
  UNIQUE KEY `uq_album_per_artist` (`ArtistID`,`AlbumName`),
  KEY `fk_album_genre` (`GenreID`),
  CONSTRAINT `fk_album_artist` FOREIGN KEY (`ArtistID`) REFERENCES `artist` (`ArtistID`) ON DELETE CASCADE,
  CONSTRAINT `fk_album_genre` FOREIGN KEY (`GenreID`) REFERENCES `genre` (`GenreID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `artist`
--

DROP TABLE IF EXISTS `artist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `artist` (
  `ArtistID` int NOT NULL,
  `ArtistBio` varchar(275) DEFAULT NULL,
  `ArtistPFP` longblob,
  `VerifiedStatus` tinyint(1) NOT NULL DEFAULT '0',
  `VerifyingAdminID` int NOT NULL,
  `DateVerified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ArtistID`),
  KEY `fk_artist_verifier` (`VerifyingAdminID`),
  CONSTRAINT `fk_artist_user` FOREIGN KEY (`ArtistID`) REFERENCES `user` (`UserID`) ON DELETE CASCADE,
  CONSTRAINT `fk_artist_verifier` FOREIGN KEY (`VerifyingAdminID`) REFERENCES `user` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `genre`
--

DROP TABLE IF EXISTS `genre`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `genre` (
  `GenreID` int NOT NULL AUTO_INCREMENT,
  `GenreName` varchar(30) NOT NULL,
  `GenreDescription` varchar(275) DEFAULT NULL,
  PRIMARY KEY (`GenreID`),
  UNIQUE KEY `GenreName` (`GenreName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `history`
--

DROP TABLE IF EXISTS `history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `history` (
  `HistoryID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  PRIMARY KEY (`HistoryID`),
  UNIQUE KEY `UserID` (`UserID`),
  CONSTRAINT `fk_history_user` FOREIGN KEY (`UserID`) REFERENCES `user` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `historysong`
--

DROP TABLE IF EXISTS `historysong`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historysong` (
  `SongID` int NOT NULL,
  `HistoryID` int NOT NULL,
  `TimeListened` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `HistoryPosition` int DEFAULT NULL,
  PRIMARY KEY (`SongID`,`HistoryID`,`TimeListened`),
  KEY `fk_historysong_history` (`HistoryID`),
  CONSTRAINT `fk_historysong_history` FOREIGN KEY (`HistoryID`) REFERENCES `history` (`HistoryID`) ON DELETE CASCADE,
  CONSTRAINT `fk_historysong_song` FOREIGN KEY (`SongID`) REFERENCES `song` (`SongID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `likedsong`
--

DROP TABLE IF EXISTS `likedsong`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `likedsong` (
  `LikesID` int NOT NULL,
  `SongID` int NOT NULL,
  `TimeLiked` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `LikedPosition` int DEFAULT NULL,
  PRIMARY KEY (`LikesID`,`SongID`),
  KEY `fk_likedsong_song` (`SongID`),
  CONSTRAINT `fk_likedsong_likes` FOREIGN KEY (`LikesID`) REFERENCES `likes` (`LikesID`) ON DELETE CASCADE,
  CONSTRAINT `fk_likedsong_song` FOREIGN KEY (`SongID`) REFERENCES `song` (`SongID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `likes`
--

DROP TABLE IF EXISTS `likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `likes` (
  `LikesID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  PRIMARY KEY (`LikesID`),
  UNIQUE KEY `UserID` (`UserID`),
  CONSTRAINT `fk_likes_user` FOREIGN KEY (`UserID`) REFERENCES `user` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `playlist`
--

DROP TABLE IF EXISTS `playlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `playlist` (
  `PlaylistID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `PlaylistName` varchar(50) NOT NULL,
  `PlaylistDescription` varchar(275) DEFAULT NULL,
  `PublicPlaylist` tinyint(1) NOT NULL DEFAULT '1',
  `PlaylistImage` longblob,
  `DateCreated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Shuffle` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`PlaylistID`),
  KEY `fk_playlist_user` (`UserID`),
  CONSTRAINT `fk_playlist_user` FOREIGN KEY (`UserID`) REFERENCES `user` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `playlistsong`
--

DROP TABLE IF EXISTS `playlistsong`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `playlistsong` (
  `PlaylistID` int NOT NULL,
  `SongID` int NOT NULL,
  `TimeAdded` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `PlaylistPosition` int DEFAULT NULL,
  PRIMARY KEY (`PlaylistID`,`SongID`),
  UNIQUE KEY `uq_position_per_playlist` (`PlaylistID`,`PlaylistPosition`),
  KEY `fk_playlistsong_song` (`SongID`),
  CONSTRAINT `fk_playlistsong_playlist` FOREIGN KEY (`PlaylistID`) REFERENCES `playlist` (`PlaylistID`) ON DELETE CASCADE,
  CONSTRAINT `fk_playlistsong_song` FOREIGN KEY (`SongID`) REFERENCES `song` (`SongID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rating`
--

DROP TABLE IF EXISTS `rating`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rating` (
  `RatingID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `RatingValue` decimal(2,1) NOT NULL,
  `RatingDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `RatingDescription` varchar(275) DEFAULT NULL,
  `RateType` enum('Song','Playlist','Album','Artist') NOT NULL,
  `RatedTypeID` int NOT NULL,
  PRIMARY KEY (`RatingID`),
  KEY `fk_rating_user` (`UserID`),
  CONSTRAINT `fk_rating_user` FOREIGN KEY (`UserID`) REFERENCES `user` (`UserID`) ON DELETE CASCADE,
  CONSTRAINT `chk_rating_value` CHECK (((`RatingValue` >= 0.0) and (`RatingValue` <= 5.0)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `song`
--

DROP TABLE IF EXISTS `song`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `song` (
  `SongID` int NOT NULL AUTO_INCREMENT,
  `SongLength` int NOT NULL,
  `SongName` varchar(50) NOT NULL,
  `GenreID` int DEFAULT NULL,
  `AlbumID` int DEFAULT NULL,
  `Listens` int NOT NULL DEFAULT '0',
  `SongFile` longblob,
  `FileFormat` varchar(10) DEFAULT NULL,
  `FileSize` bigint DEFAULT NULL,
  `Explicit` tinyint(1) NOT NULL DEFAULT '0',
  `TrackNumber` int NOT NULL,
  `CopyRightInfo` varchar(275) DEFAULT NULL,
  PRIMARY KEY (`SongID`),
  UNIQUE KEY `uq_track_per_album` (`AlbumID`,`TrackNumber`),
  KEY `fk_song_genre` (`GenreID`),
  CONSTRAINT `fk_song_album` FOREIGN KEY (`AlbumID`) REFERENCES `album` (`AlbumID`) ON DELETE SET NULL,
  CONSTRAINT `fk_song_genre` FOREIGN KEY (`GenreID`) REFERENCES `genre` (`GenreID`),
  CONSTRAINT `chk_filesize_nonneg` CHECK (((`FileSize` is null) or (`FileSize` >= 0))),
  CONSTRAINT `chk_listens_nonneg` CHECK ((`Listens` >= 0)),
  CONSTRAINT `chk_song_length` CHECK (((`SongLength` > 0) and (`SongLength` < 3600))),
  CONSTRAINT `chk_songname_chars` CHECK (regexp_like(`SongName`,_cp850'^[^\\/:*?"<>|]+$'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `UserID` int NOT NULL AUTO_INCREMENT,
  `Username` varchar(30) NOT NULL,
  `UserPassword` varchar(255) NOT NULL,
  `FirstName` varchar(30) NOT NULL,
  `LastName` varchar(30) NOT NULL,
  `DateOfBirth` date NOT NULL,
  `Email` varchar(255) NOT NULL,
  `UserType` enum('Listener','Administrator','Artist','Developer') NOT NULL,
  `DateJoined` date NOT NULL,
  `Country` varchar(30) NOT NULL,
  `City` varchar(30) DEFAULT NULL,
  `IsOnline` tinyint(1) NOT NULL DEFAULT '0',
  `AccountStatus` enum('Active','Suspended','Banned') NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `Username` (`Username`),
  UNIQUE KEY `Email` (`Email`),
  CONSTRAINT `chk_email_format` CHECK (regexp_like(`Email`,_cp850'^[^@\n]+@[^@\n]+.[^@\n]+$')),
  CONSTRAINT `chk_firstname_chars` CHECK (regexp_like(`FirstName`,_cp850'^[A-Za-z0-9_ ]+$')),
  CONSTRAINT `chk_lastname_chars` CHECK (regexp_like(`LastName`,_cp850'^[A-Za-z0-9_ ]+$')),
  CONSTRAINT `chk_username_chars` CHECK (regexp_like(`Username`,_cp850'^[A-Za-z0-9_]+$'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `userfollows`
--

DROP TABLE IF EXISTS `userfollows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userfollows` (
  `FollowerID` int NOT NULL,
  `ArtistID` int NOT NULL,
  `DateFollowed` date NOT NULL,
  PRIMARY KEY (`FollowerID`,`ArtistID`),
  KEY `fk_follows_artist` (`ArtistID`),
  CONSTRAINT `fk_follows_artist` FOREIGN KEY (`ArtistID`) REFERENCES `artist` (`ArtistID`) ON DELETE CASCADE,
  CONSTRAINT `fk_follows_user` FOREIGN KEY (`FollowerID`) REFERENCES `user` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-05 15:49:58


