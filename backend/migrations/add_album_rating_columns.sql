-- Migration: Add AverageRating and TotalRatings columns to album table
-- Run this in MySQL Workbench or command line

USE coogmusic;

-- Add AverageRating column (if it doesn't exist, you'll get an error - that's okay, just continue)
ALTER TABLE album 
ADD COLUMN AverageRating DECIMAL(3,2) DEFAULT 0.00 COMMENT 'Average rating from 1.00 to 5.00';

-- Add TotalRatings column (if it doesn't exist, you'll get an error - that's okay, just continue)
ALTER TABLE album 
ADD COLUMN TotalRatings INT DEFAULT 0 COMMENT 'Total number of ratings received';

-- Update existing albums with calculated ratings from album_ratings table
UPDATE album a
LEFT JOIN (
    SELECT 
        AlbumID,
        ROUND(AVG(Rating), 2) as avg_rating,
        COUNT(*) as total_ratings
    FROM album_ratings
    GROUP BY AlbumID
) ar ON a.AlbumID = ar.AlbumID
SET 
    a.AverageRating = COALESCE(ar.avg_rating, 0.00),
    a.TotalRatings = COALESCE(ar.total_ratings, 0);

-- Verify the columns were added
DESCRIBE album;

