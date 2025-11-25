-- MySQL dump 10.13  Distrib 8.4.6, for Win64 (x86_64)
--
-- Host: localhost    Database: coogmusic
-- ------------------------------------------------------
-- Server version	8.4.6
--
-- CoogMusic Complete Database Dump
-- Includes: All tables, foreign key relationships, indexes, constraints, and triggers
-- Generated: 2025-01-XX

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
-- Table structure for table `userprofile`
--

DROP TABLE IF EXISTS `userprofile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userprofile` (
  `UserID` int NOT NULL AUTO_INCREMENT,
  `Username` varchar(50) NOT NULL,
  `UserPassword` varchar(255) NOT NULL,
  `FirstName` varchar(100) NOT NULL,
  `LastName` varchar(100) NOT NULL,
  `DateOfBirth` date NOT NULL,
  `Email` varchar(255) NOT NULL,
  `UserType` enum('Listener','Artist','Administrator','Analyst') NOT NULL DEFAULT 'Listener',
  `DateJoined` date NOT NULL DEFAULT (CURRENT_DATE),
  `Country` varchar(100) NOT NULL,
  `City` varchar(100) DEFAULT NULL,
  `AccountStatus` enum('Active','Banned') NOT NULL DEFAULT 'Active',
  `IsOnline` tinyint(1) NOT NULL DEFAULT '0',
  `LastLogin` datetime DEFAULT NULL,
  `ProfilePicture` longblob,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `Username` (`Username`),
  UNIQUE KEY `Email` (`Email`),
  KEY `idx_username` (`Username`),
  KEY `idx_email` (`Email`),
  KEY `idx_user_type` (`UserType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `artist`
--

DROP TABLE IF EXISTS `artist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `artist` (
  `ArtistID` int NOT NULL,
  `ArtistBio` text,
  `ArtistPFP` longblob,
  `VerifiedStatus` tinyint(1) NOT NULL DEFAULT '0',
  `VerifyingAdminID` int DEFAULT NULL,
  `DateVerified` date DEFAULT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ArtistID`),
  KEY `idx_verified` (`VerifiedStatus`),
  KEY `fk_artist_verifier` (`VerifyingAdminID`),
  CONSTRAINT `fk_artist_user` FOREIGN KEY (`ArtistID`) REFERENCES `userprofile` (`UserID`) ON DELETE CASCADE,
  CONSTRAINT `fk_artist_verifier` FOREIGN KEY (`VerifyingAdminID`) REFERENCES `userprofile` (`UserID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `genre`
--

DROP TABLE IF EXISTS `genre`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `genre` (
  `GenreID` int NOT NULL AUTO_INCREMENT,
  `GenreName` varchar(100) NOT NULL,
  `Description` text,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`GenreID`),
  UNIQUE KEY `GenreName` (`GenreName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `album`
--

DROP TABLE IF EXISTS `album`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `album` (
  `AlbumID` int NOT NULL AUTO_INCREMENT,
  `AlbumName` varchar(255) NOT NULL,
  `ArtistID` int NOT NULL,
  `ReleaseDate` date NOT NULL,
  `AlbumCover` longblob,
  `Description` text,
  `AverageRating` decimal(3,2) DEFAULT '0.00',
  `TotalRatings` int DEFAULT '0',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`AlbumID`),
  KEY `idx_artist` (`ArtistID`),
  CONSTRAINT `fk_album_artist` FOREIGN KEY (`ArtistID`) REFERENCES `artist` (`ArtistID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `song`
--

DROP TABLE IF EXISTS `song`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `song` (
  `SongID` int NOT NULL AUTO_INCREMENT,
  `SongName` varchar(255) NOT NULL,
  `ArtistID` int NOT NULL,
  `AlbumID` int DEFAULT NULL,
  `GenreID` int DEFAULT NULL,
  `Duration` int NOT NULL,
  `ListenCount` int NOT NULL DEFAULT '0',
  `AverageRating` decimal(3,2) DEFAULT '0.00',
  `TotalRatings` int DEFAULT '0',
  `FilePath` varchar(500) NOT NULL,
  `FileSize` bigint NOT NULL,
  `ReleaseDate` date NOT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`SongID`),
  KEY `idx_song_artist` (`ArtistID`),
  KEY `idx_song_album` (`AlbumID`),
  KEY `idx_song_genre` (`GenreID`),
  CONSTRAINT `fk_song_album` FOREIGN KEY (`AlbumID`) REFERENCES `album` (`AlbumID`) ON DELETE SET NULL,
  CONSTRAINT `fk_song_artist` FOREIGN KEY (`ArtistID`) REFERENCES `artist` (`ArtistID`) ON DELETE CASCADE,
  CONSTRAINT `fk_song_genre` FOREIGN KEY (`GenreID`) REFERENCES `genre` (`GenreID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `playlist`
--

DROP TABLE IF EXISTS `playlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `playlist` (
  `PlaylistID` int NOT NULL AUTO_INCREMENT,
  `PlaylistName` varchar(255) NOT NULL,
  `UserID` int NOT NULL,
  `Description` text,
  `IsPublic` tinyint(1) NOT NULL DEFAULT '0',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`PlaylistID`),
  KEY `idx_playlist_user` (`UserID`),
  KEY `idx_playlist_public` (`IsPublic`),
  CONSTRAINT `fk_playlist_user` FOREIGN KEY (`UserID`) REFERENCES `userprofile` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `playlist_song`
--

DROP TABLE IF EXISTS `playlist_song`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `playlist_song` (
  `PlaylistID` int NOT NULL,
  `SongID` int NOT NULL,
  `Position` int NOT NULL,
  `AddedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`PlaylistID`,`SongID`),
  CONSTRAINT `fk_playlistsong_playlist` FOREIGN KEY (`PlaylistID`) REFERENCES `playlist` (`PlaylistID`) ON DELETE CASCADE,
  CONSTRAINT `fk_playlistsong_song` FOREIGN KEY (`SongID`) REFERENCES `song` (`SongID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_follows_artist`
--

DROP TABLE IF EXISTS `user_follows_artist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_follows_artist` (
  `UserID` int NOT NULL,
  `ArtistID` int NOT NULL,
  `FollowedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserID`,`ArtistID`),
  CONSTRAINT `fk_follows_artist` FOREIGN KEY (`ArtistID`) REFERENCES `artist` (`ArtistID`) ON DELETE CASCADE,
  CONSTRAINT `fk_follows_user` FOREIGN KEY (`UserID`) REFERENCES `userprofile` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_likes_song`
--

DROP TABLE IF EXISTS `user_likes_song`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_likes_song` (
  `UserID` int NOT NULL,
  `SongID` int NOT NULL,
  `LikedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserID`,`SongID`),
  CONSTRAINT `fk_likedsong_song` FOREIGN KEY (`SongID`) REFERENCES `song` (`SongID`) ON DELETE CASCADE,
  CONSTRAINT `fk_likedsong_user` FOREIGN KEY (`UserID`) REFERENCES `userprofile` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_likes_album`
--

DROP TABLE IF EXISTS `user_likes_album`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_likes_album` (
  `UserID` int NOT NULL,
  `AlbumID` int NOT NULL,
  `LikedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserID`,`AlbumID`),
  CONSTRAINT `fk_likesalbum_album` FOREIGN KEY (`AlbumID`) REFERENCES `album` (`AlbumID`) ON DELETE CASCADE,
  CONSTRAINT `fk_likesalbum_user` FOREIGN KEY (`UserID`) REFERENCES `userprofile` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_likes_playlist`
--

DROP TABLE IF EXISTS `user_likes_playlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_likes_playlist` (
  `UserID` int NOT NULL,
  `PlaylistID` int NOT NULL,
  `LikedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserID`,`PlaylistID`),
  CONSTRAINT `fk_likesplaylist_playlist` FOREIGN KEY (`PlaylistID`) REFERENCES `playlist` (`PlaylistID`) ON DELETE CASCADE,
  CONSTRAINT `fk_likesplaylist_user` FOREIGN KEY (`UserID`) REFERENCES `userprofile` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `listening_history`
--

DROP TABLE IF EXISTS `listening_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `listening_history` (
  `HistoryID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `SongID` int NOT NULL,
  `ListenedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Duration` int DEFAULT NULL,
  PRIMARY KEY (`HistoryID`),
  KEY `idx_listening_history_user` (`UserID`),
  KEY `idx_listening_history_song` (`SongID`),
  KEY `idx_listening_history_date` (`ListenedAt`),
  CONSTRAINT `fk_history_song` FOREIGN KEY (`SongID`) REFERENCES `song` (`SongID`) ON DELETE CASCADE,
  CONSTRAINT `fk_history_user` FOREIGN KEY (`UserID`) REFERENCES `userprofile` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `song_ratings`
--

DROP TABLE IF EXISTS `song_ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `song_ratings` (
  `UserID` int NOT NULL,
  `SongID` int NOT NULL,
  `Rating` tinyint NOT NULL,
  `RatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserID`,`SongID`),
  KEY `idx_song_ratings_user` (`UserID`),
  KEY `idx_song_ratings_song` (`SongID`),
  KEY `idx_song_ratings_rating` (`Rating`),
  CONSTRAINT `chk_rating_value` CHECK ((`Rating` >= 1) AND (`Rating` <= 5)),
  CONSTRAINT `fk_songratings_song` FOREIGN KEY (`SongID`) REFERENCES `song` (`SongID`) ON DELETE CASCADE,
  CONSTRAINT `fk_songratings_user` FOREIGN KEY (`UserID`) REFERENCES `userprofile` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `album_ratings`
--

DROP TABLE IF EXISTS `album_ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `album_ratings` (
  `UserID` int NOT NULL,
  `AlbumID` int NOT NULL,
  `Rating` tinyint NOT NULL,
  `RatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserID`,`AlbumID`),
  KEY `idx_album_ratings_user` (`UserID`),
  KEY `idx_album_ratings_album` (`AlbumID`),
  KEY `idx_album_ratings_rating` (`Rating`),
  CONSTRAINT `chk_album_rating_value` CHECK ((`Rating` >= 1) AND (`Rating` <= 5)),
  CONSTRAINT `fk_albumratings_album` FOREIGN KEY (`AlbumID`) REFERENCES `album` (`AlbumID`) ON DELETE CASCADE,
  CONSTRAINT `fk_albumratings_user` FOREIGN KEY (`UserID`) REFERENCES `userprofile` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `NotificationID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `ArtistID` int NOT NULL,
  `SongID` int NOT NULL,
  `NotificationType` enum('new_song','new_album','artist_update') NOT NULL DEFAULT 'new_song',
  `Message` text NOT NULL,
  `IsRead` tinyint(1) NOT NULL DEFAULT '0',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ReadAt` datetime DEFAULT NULL,
  PRIMARY KEY (`NotificationID`),
  KEY `idx_notifications_user` (`UserID`),
  KEY `idx_notifications_read` (`IsRead`),
  KEY `idx_notifications_created` (`CreatedAt`),
  CONSTRAINT `fk_notifications_artist` FOREIGN KEY (`ArtistID`) REFERENCES `artist` (`ArtistID`) ON DELETE CASCADE,
  CONSTRAINT `fk_notifications_song` FOREIGN KEY (`SongID`) REFERENCES `song` (`SongID`) ON DELETE CASCADE,
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`UserID`) REFERENCES `userprofile` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notification_settings`
--

DROP TABLE IF EXISTS `notification_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_settings` (
  `UserID` int NOT NULL,
  `NewSongNotifications` tinyint(1) NOT NULL DEFAULT '1',
  `NewAlbumNotifications` tinyint(1) NOT NULL DEFAULT '1',
  `ArtistUpdateNotifications` tinyint(1) NOT NULL DEFAULT '1',
  `OnlyVerifiedArtists` tinyint(1) NOT NULL DEFAULT '0',
  `EmailNotifications` tinyint(1) NOT NULL DEFAULT '0',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserID`),
  CONSTRAINT `fk_notificationsettings_user` FOREIGN KEY (`UserID`) REFERENCES `userprofile` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping triggers
--

DROP TRIGGER IF EXISTS `after_rating_insert`;
DELIMITER ;;
CREATE TRIGGER `after_rating_insert` AFTER INSERT ON `song_ratings` FOR EACH ROW BEGIN
    UPDATE song 
    SET 
        TotalRatings = (SELECT COUNT(*) FROM song_ratings WHERE SongID = NEW.SongID),
        AverageRating = (SELECT AVG(Rating) FROM song_ratings WHERE SongID = NEW.SongID)
    WHERE SongID = NEW.SongID;
END ;;
DELIMITER ;

DROP TRIGGER IF EXISTS `after_rating_update`;
DELIMITER ;;
CREATE TRIGGER `after_rating_update` AFTER UPDATE ON `song_ratings` FOR EACH ROW BEGIN
    UPDATE song 
    SET 
        TotalRatings = (SELECT COUNT(*) FROM song_ratings WHERE SongID = NEW.SongID),
        AverageRating = (SELECT AVG(Rating) FROM song_ratings WHERE SongID = NEW.SongID)
    WHERE SongID = NEW.SongID;
END ;;
DELIMITER ;

DROP TRIGGER IF EXISTS `after_rating_delete`;
DELIMITER ;;
CREATE TRIGGER `after_rating_delete` AFTER DELETE ON `song_ratings` FOR EACH ROW BEGIN
    UPDATE song 
    SET 
        TotalRatings = (SELECT COUNT(*) FROM song_ratings WHERE SongID = OLD.SongID),
        AverageRating = COALESCE((SELECT AVG(Rating) FROM song_ratings WHERE SongID = OLD.SongID), 0.00)
    WHERE SongID = OLD.SongID;
END ;;
DELIMITER ;

DROP TRIGGER IF EXISTS `after_album_rating_insert`;
DELIMITER ;;
CREATE TRIGGER `after_album_rating_insert` AFTER INSERT ON `album_ratings` FOR EACH ROW BEGIN
    UPDATE album 
    SET 
        TotalRatings = (SELECT COUNT(*) FROM album_ratings WHERE AlbumID = NEW.AlbumID),
        AverageRating = (SELECT AVG(Rating) FROM album_ratings WHERE AlbumID = NEW.AlbumID)
    WHERE AlbumID = NEW.AlbumID;
END ;;
DELIMITER ;

DROP TRIGGER IF EXISTS `after_album_rating_update`;
DELIMITER ;;
CREATE TRIGGER `after_album_rating_update` AFTER UPDATE ON `album_ratings` FOR EACH ROW BEGIN
    UPDATE album 
    SET 
        TotalRatings = (SELECT COUNT(*) FROM album_ratings WHERE AlbumID = NEW.AlbumID),
        AverageRating = (SELECT AVG(Rating) FROM album_ratings WHERE AlbumID = NEW.AlbumID)
    WHERE AlbumID = NEW.AlbumID;
END ;;
DELIMITER ;

DROP TRIGGER IF EXISTS `after_album_rating_delete`;
DELIMITER ;;
CREATE TRIGGER `after_album_rating_delete` AFTER DELETE ON `album_ratings` FOR EACH ROW BEGIN
    UPDATE album 
    SET 
        TotalRatings = (SELECT COUNT(*) FROM album_ratings WHERE AlbumID = OLD.AlbumID),
        AverageRating = COALESCE((SELECT AVG(Rating) FROM album_ratings WHERE AlbumID = OLD.AlbumID), 0.00)
    WHERE AlbumID = OLD.AlbumID;
END ;;
DELIMITER ;

DROP TRIGGER IF EXISTS `verify_artist_on_20_followers`;
DELIMITER ;;
CREATE TRIGGER `verify_artist_on_20_followers` AFTER INSERT ON `user_follows_artist` FOR EACH ROW BEGIN
    DECLARE follower_count INT;
    DECLARE artist_verified TINYINT;
    
    -- Count current followers for this artist
    SELECT COUNT(*) INTO follower_count
    FROM user_follows_artist
    WHERE ArtistID = NEW.ArtistID;
    
    -- Check current verification status
    SELECT VerifiedStatus INTO artist_verified
    FROM artist
    WHERE ArtistID = NEW.ArtistID;
    
    -- Auto-verify if artist reaches 20 followers and is not already verified
    IF follower_count >= 20 AND artist_verified = 0 THEN
        UPDATE artist 
        SET 
            VerifiedStatus = 1,
            DateVerified = CURDATE(),
            VerifyingAdminID = NULL,
            UpdatedAt = NOW()
        WHERE ArtistID = NEW.ArtistID;
    END IF;
END ;;
DELIMITER ;

DROP TRIGGER IF EXISTS `unverify_artist_below_20_followers`;
DELIMITER ;;
CREATE TRIGGER `unverify_artist_below_20_followers` AFTER DELETE ON `user_follows_artist` FOR EACH ROW BEGIN
    DECLARE follower_count INT;
    DECLARE artist_verified TINYINT;
    DECLARE admin_verified TINYINT;
    
    -- Count remaining followers for this artist
    SELECT COUNT(*) INTO follower_count
    FROM user_follows_artist
    WHERE ArtistID = OLD.ArtistID;
    
    -- Check current verification status and if it was admin-verified
    SELECT VerifiedStatus, 
           CASE WHEN VerifyingAdminID IS NULL THEN 0 ELSE 1 END
    INTO artist_verified, admin_verified
    FROM artist
    WHERE ArtistID = OLD.ArtistID;
    
    -- Only auto-unverify if:
    -- 1. Artist is currently verified
    -- 2. They have less than 20 followers
    -- 3. They were auto-verified (VerifyingAdminID IS NULL)
    -- Note: We preserve manual admin verifications
    IF follower_count < 20 AND artist_verified = 1 AND admin_verified = 0 THEN
        UPDATE artist 
        SET 
            VerifiedStatus = 0,
            DateVerified = NULL,
            VerifyingAdminID = NULL,
            UpdatedAt = NOW()
        WHERE ArtistID = OLD.ArtistID;
    END IF;
END ;;
DELIMITER ;

DROP TRIGGER IF EXISTS `remove_song_from_playlists_on_delete`;
DELIMITER ;;
CREATE TRIGGER `remove_song_from_playlists_on_delete` BEFORE DELETE ON `song` FOR EACH ROW BEGIN
    -- Remove song from all playlists
    DELETE FROM playlist_song WHERE SongID = OLD.SongID;
    
    -- Remove all likes for this song (additional safety beyond CASCADE)
    DELETE FROM user_likes_song WHERE SongID = OLD.SongID;
    
    -- Remove from listening history (additional safety beyond CASCADE)
    DELETE FROM listening_history WHERE SongID = OLD.SongID;
    
    -- Note: Album relationship is handled automatically - when the song is deleted,
    -- it's no longer part of any album (since AlbumID is a reference field in the song table)
END ;;
DELIMITER ;

DROP TRIGGER IF EXISTS `delete_songs_on_album_delete`;
DELIMITER ;;
CREATE TRIGGER `delete_songs_on_album_delete` BEFORE DELETE ON `album` FOR EACH ROW BEGIN
    -- Delete all songs that belong to this album
    -- This trigger will cascade and also trigger the remove_song_from_playlists_on_delete
    -- for each song, ensuring all related data is cleaned up
    DELETE FROM song WHERE AlbumID = OLD.AlbumID;
END ;;
DELIMITER ;

DROP TRIGGER IF EXISTS `create_default_notification_settings`;
DELIMITER ;;
CREATE TRIGGER `create_default_notification_settings` AFTER INSERT ON `userprofile` FOR EACH ROW BEGIN
    INSERT INTO notification_settings (UserID)
    VALUES (NEW.UserID);
END ;;
DELIMITER ;

DROP TRIGGER IF EXISTS `notify_followers_new_song`;
DELIMITER ;;
CREATE TRIGGER `notify_followers_new_song` AFTER INSERT ON `song` FOR EACH ROW BEGIN
    DECLARE artist_name VARCHAR(201);
    DECLARE song_notification_message TEXT;
    
    -- Get artist's full name
    SELECT CONCAT(up.FirstName, ' ', up.LastName) INTO artist_name
    FROM userprofile up
    WHERE up.UserID = NEW.ArtistID;
    
    -- Create the notification message
    SET song_notification_message = CONCAT(artist_name, ' just posted a new song "', NEW.SongName, '" - go check it out!');
    
    -- Insert notifications for all followers who have new song notifications enabled
    INSERT INTO notifications (UserID, ArtistID, SongID, NotificationType, Message, CreatedAt)
    SELECT 
        uf.UserID,
        NEW.ArtistID,
        NEW.SongID,
        'new_song',
        song_notification_message,
        NOW()
    FROM user_follows_artist uf
    INNER JOIN notification_settings ns ON uf.UserID = ns.UserID
    WHERE uf.ArtistID = NEW.ArtistID 
        AND ns.NewSongNotifications = 1
        AND (ns.OnlyVerifiedArtists = 0 OR EXISTS(
            SELECT 1 FROM artist a 
            WHERE a.ArtistID = NEW.ArtistID AND a.VerifiedStatus = 1
        ));
END ;;
DELIMITER ;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-01-XX XX:XX:XX

