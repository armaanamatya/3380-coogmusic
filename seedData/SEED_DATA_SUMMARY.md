# CoogMusic Database Seed Data Summary

## Overview
This document summarizes the comprehensive seed data files created for the CoogMusic database, ensuring complete coverage of all possible attribute values and realistic data distribution.

## Seed Data Files

### 1. `seed_data_corrected.sql` (Basic Seed Data)
- **UserIDs 1-4**: Admin accounts (Armaan Amatya, Josh Regner, Maick Ibassa, Jordan Kittley)
- **UserIDs 5-35**: Artists (Taylor Swift, Ed Sheeran, Billie Eilish, etc.)
- **UserIDs 36-136**: Listeners (Emma Smith, Michael Thompson, David Rodriguez, etc.)
- **Genres**: 17 genres as defined & inserted by schema
- **Albums**: 70 albums, each song in album is the same genre
- **Songs**: 350 songs by artists
- **Playlists**: 10 broad playlists with random songs in them and 10 specific playlists with 

## Account Status Distribution

| Account Status | Count |
|----------------|-------|
| Active | 27 Artists & 71 listeners |
| Suspended | 3 Artists & 23 listeners |
| Banned | 6 listeners |

## Geographic Distribution

The comprehensive seed data includes users from **20+ countries**:
- United States (majority)
- United Kingdom
- Canada
- Japan, South Korea, China
- Brazil, Mexico
- Germany, France, Italy, Spain
- Australia, New Zealand
- Jamaica, South Africa
- Norway, Sweden, Netherlands, Belgium
- Iceland, Ireland
- Russia, Austria

## Relationship Coverage

### User Follows Artist
- **Listener Follows**: Listeners only follow other listeners if they have at least one public playlist
- **Total Follows**: Total of 500 followers across all listeners and artists
- **Coverage**: Every artist has multiple followers
- **Distribution**: Random Normal Distribution of number of followers among artists

### User Likes
- **Liked Songs**: 350 likes across all genres
- **Liked Albums**: 200 likes covering all album
- **Liked Playlists**: 100 likes across all public playlists
- **Like Distribution**: amount of likes on songs, albums, and playlists are randomized

### Listening History
- **User History**: Up to 150 listened songs in history for each user
- **Coverage**: All user types and all genres represented
- **Realistic Patterns**: Varied durations and timestamps

### Playlist Songs
- **Total Entries**: Up to 100 songs in each user playlist
- **Coverage**: All playlists have multiple songs
- **Diversity**: Songs from all genres in various playlists

## Data Quality Features

### 1. **Realistic Timestamps**
- All timestamps follow logical chronological order
- Realistic gaps between events
- Proper date ranges (2020-2024)

### 2. **Consistent Relationships**
- All foreign key references are valid
- No orphaned records
- Proper cascade relationships

### 3. **Diverse Content**
- Songs range from 20 seconds to an hour
- File sizes up to 100MB with a direct relationship to duration of song
- Listen counts from 20,000 to 100,000
- Mix of public and private playlists

### 4. **Edge Cases Covered**
- Suspended and banned users
- Online and Offline users
- Private playlists
- Deceased artists (historical data)
- International users with various time zones

## Final Database Statistics

## Usage Instructions

1. **Run Complete Seed Data**:
   ```bash
   sqlite3 coogmusic.db < run_seed_data.sql
   ```

2. **Run Individual Files** (in order):
   ```bash
   sqlite3 coogmusic.db < backend/src/schema.sqlite.sql
   sqlite3 coogmusic.db < seed_data.sql
   ```

3. **Windows Batch Script**:
   ```bash
   seed_database_sqlite.bat
   ```

## Testing Scenarios Covered

- ✅ All user types and statuses
- ✅ All genres with multiple artists and songs
- ✅ International user base
- ✅ Complete relationship coverage
- ✅ Edge cases (suspended, banned, offline users)
- ✅ Realistic data patterns and distributions
- ✅ Comprehensive playlist diversity
- ✅ Historical and contemporary artists
- ✅ Various account verification statuses
- ✅ Mixed public/private content

This comprehensive seed data ensures that any application testing or development will have realistic, diverse data covering all possible scenarios and edge cases.
