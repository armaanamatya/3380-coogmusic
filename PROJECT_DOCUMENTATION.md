 # CoogMusic Project Documentation
**Database Systems Course Project (COSC 3380)**  
**University of Houston**

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Types of Data Operations](#types-of-data-operations)
3. [User Roles and Permissions](#user-roles-and-permissions)
4. [Semantic Constraints and Triggers](#semantic-constraints-and-triggers)
5. [Available Queries and Reports](#available-queries-and-reports)
6. [Database Schema Details](#database-schema-details)
7. [Test Accounts](#test-accounts)

---

## 1. Project Overview

CoogMusic is a comprehensive music streaming platform that demonstrates advanced database concepts including relational design, triggers, user roles, and complex queries. The system supports multiple user types with different permissions and provides comprehensive analytics and reporting capabilities.

### Key Components
- **Backend**: TypeScript/Node.js server with custom HTTP implementation
- **Frontend**: React application with TypeScript
- **Database**: MySQL with 15+ tables, comprehensive triggers, and constraints
- **File Management**: Local storage for music files and user avatars

---

## 2. Types of Data Operations

The CoogMusic platform supports comprehensive CRUD (Create, Read, Update, Delete) operations across all major data entities:

### 2.1 User Account Management

#### **Create Operations**
- **User Registration**: Create new user accounts with profile information
  - Requires: Username, password, email, name, date of birth, location
  - Automatic: Profile creation, notification settings setup
  - Files: Optional profile picture upload (5MB limit)
  
- **Artist Profile Creation**: Automatic when user type is set to "Artist"
  - Includes: Artist bio, profile picture, verification status
  - Triggers: Default notification settings creation

#### **Read Operations**
- **Profile Retrieval**: Get user profile information
- **Artist Browsing**: List all artists with sorting options
- **User Search**: Search users by username or name

#### **Update Operations**
- **Profile Updates**: Modify user information, profile pictures
- **Artist Information**: Update bio, profile picture
- **Account Status**: Admin-only status changes (active, suspended, banned)
- **Online Status**: Automatic updates on login/logout

#### **Delete Operations**
- **Account Deletion**: Complete user removal with cascade cleanup
- **Profile Picture Removal**: Delete and replace with default

### 2.2 Music Content Management

#### **Create Operations**
- **Song Upload**: Artists can upload new music
  - Supported formats: MP3, WAV, FLAC, M4A, AAC (up to 50MB)
  - Metadata: Title, duration, genre, album association
  - Automatic: File size calculation, release date setting

- **Album Creation**: Artists can create new albums
  - Includes: Name, release date, description, cover art
  - Automatic: Album-artist relationship establishment

#### **Read Operations**
- **Music Browsing**: Search and filter songs by multiple criteria
  - Filter options: Artist, genre, album, date, popularity
  - Pagination: Configurable page sizes
  - Sorting: By name, date, listen count, rating

- **Album Viewing**: Complete album information with track listing
- **Song Details**: Individual song information with play statistics

#### **Update Operations**
- **Song Metadata**: Artists can update song information
- **Album Information**: Modify album details and cover art
- **Listen Count**: Automatic increment on song plays
- **Rating Statistics**: Automatic updates via triggers

#### **Delete Operations**
- **Song Removal**: Artists can delete their songs
  - Cascade: Removes from playlists, likes, history
  - Trigger: Automatic cleanup of related data
  
- **Album Deletion**: Complete album removal
  - Trigger: Automatic deletion of all album songs

### 2.3 Playlist Management

#### **Create Operations**
- **Playlist Creation**: Users create custom playlists
  - Options: Public/private visibility, description
  - Automatic: Creator assignment, timestamp setting

- **Song Addition**: Add songs to playlists with position tracking

#### **Read Operations**
- **Playlist Browsing**: View public playlists, personal playlists
- **Playlist Contents**: Retrieve songs in playlist with order

#### **Update Operations**
- **Playlist Details**: Modify name, description, privacy settings
- **Song Reordering**: Change song positions within playlists
- **Collaborative Editing**: Multiple users can modify shared playlists

#### **Delete Operations**
- **Playlist Deletion**: Complete playlist removal
- **Song Removal**: Remove individual songs from playlists

### 2.4 Social Interactions

#### **Create Operations**
- **Like Actions**: Users can like songs, albums, and playlists
- **Follow Artists**: Users can follow their favorite artists
- **Ratings**: Rate songs and albums (1-5 stars scale)

#### **Read Operations**
- **Like Lists**: View user's liked content
- **Following Lists**: View followed artists
- **Social Statistics**: View like counts, follower counts

#### **Update Operations**
- **Rating Changes**: Modify existing ratings
- **Follow Status**: Change following relationships

#### **Delete Operations**
- **Unlike Actions**: Remove likes from content
- **Unfollow Artists**: Remove following relationships
- **Rating Removal**: Delete rating entries

### 2.5 Listening History and Analytics

#### **Create Operations**
- **Play Tracking**: Automatic history creation on song plays
  - Includes: Timestamp, duration listened, user identification

#### **Read Operations**
- **History Retrieval**: View personal listening history
- **Analytics Data**: Comprehensive statistics for artists and admins
- **Trend Analysis**: Popular songs, artists, genres over time

#### **Update Operations**
- **Play Duration**: Update listening duration for incomplete plays

#### **Delete Operations**
- **History Cleanup**: Remove old history entries (admin function)

---

## 3. User Roles and Permissions

The CoogMusic platform implements a comprehensive role-based access control system with four distinct user types:

### 3.1 Listeners (Standard Users)

#### **Core Permissions**
- **Music Consumption**:
  - Stream all public music content
  - Search and browse songs, albums, artists, genres
  - View detailed information about music content
  - Access listening history and recommendations

- **Playlist Management**:
  - Create unlimited personal playlists
  - Add/remove songs from own playlists
  - Modify playlist privacy settings (public/private)
  - View and follow public playlists

- **Social Features**:
  - Like songs, albums, and playlists
  - Follow artists for updates
  - Rate music content (1-5 stars)
  - Receive notifications from followed artists

- **Profile Management**:
  - Update personal profile information
  - Upload and modify profile picture
  - Configure notification preferences
  - View personal analytics (listening habits)

#### **Restrictions**
- Cannot upload music content
- Cannot access artist analytics
- Cannot perform administrative functions
- Cannot modify other users' content

### 3.2 Artists (Content Creators)

#### **Inherited Permissions**
- All Listener permissions listed above

#### **Additional Artist Permissions**
- **Music Upload and Management**:
  - Upload new songs with metadata
  - Create and manage albums
  - Update song and album information
  - Delete own music content
  - Set genre associations

- **Artist Profile**:
  - Enhanced artist bio and description
  - Verification status display
  - Artist-specific profile picture
  - Public artist page with music catalog

- **Analytics and Insights**:
  - View detailed analytics for own music
  - Track listener demographics and engagement
  - Monitor song performance metrics
  - Analyze follower growth and trends

- **Fan Engagement**:
  - Automatic notifications sent to followers
  - View follower lists and statistics
  - Engage with fan feedback

#### **Restrictions**
- Can only modify own music content
- Cannot access system-wide analytics
- Cannot perform user management functions
- Cannot verify other artists

### 3.3 Administrators (System Managers)

#### **Inherited Permissions**
- All Listener permissions

#### **System Management**
- **User Account Administration**:
  - View all user accounts and profiles
  - Modify user account status (active, suspended, banned)
  - Change user roles and permissions
  - Delete user accounts if necessary

- **Content Moderation**:
  - Review and remove inappropriate content
  - Manage content reports and complaints
  - Monitor platform activity and usage

- **Artist Management**:
  - Manually verify artists
  - Override automatic verification systems
  - Manage artist applications and appeals
  - Review artist content and profiles

- **Platform Analytics**:
  - Access system-wide analytics and reports
  - Monitor platform performance and usage
  - Generate administrative reports
  - View comprehensive user statistics

#### **Restrictions**
- Cannot upload music content as artist (unless also artist role)
- Must follow platform policies for user management

### 3.4 Analysts (Data and Reporting)

#### **Inherited Permissions**
- All Listener permissions

#### **Advanced Analytics Access**
- **Comprehensive Reporting**:
  - Generate detailed analytics reports
  - Access advanced filtering and date ranges
  - Export data for external analysis
  - Create custom report parameters

- **Data Insights**:
  - Demographics analysis across user base
  - Geographic distribution reports
  - Usage pattern analysis
  - Trend identification and forecasting

- **Performance Metrics**:
  - Platform-wide performance monitoring
  - User engagement analytics
  - Content popularity analysis
  - Revenue and growth metrics

#### **Restrictions**
- Cannot modify user accounts or content
- Cannot perform administrative functions
- Read-only access to system data
- Cannot upload music content

### 3.5 Role Management

#### **Role Assignment**
- **Default Role**: New users start as Listeners
- **Artist Upgrade**: Users can request artist status during registration
- **Administrative Assignment**: Only administrators can assign admin or analyst roles
- **Multiple Roles**: Users can have multiple roles (e.g., Artist + Analyst)

#### **Role Verification**
- **Automatic Artist Verification**: Artists with 20+ followers are automatically verified
- **Manual Verification**: Administrators can manually verify artists
- **Verification Benefits**: Verified artists receive enhanced visibility and credibility

---

## 4. Semantic Constraints and Triggers

The CoogMusic database implements sophisticated semantic constraints through database triggers that automatically maintain data integrity and business logic:

### 4.1 Rating Statistics Management

#### **Trigger: Song Rating Updates**
- **Names**: `after_rating_insert`, `after_rating_update`, `after_rating_delete`
- **Purpose**: Automatically maintain accurate rating statistics for songs
- **Business Logic**:
  - Calculates average rating when new ratings are added
  - Recalculates statistics when ratings are modified
  - Updates total rating count for each song
  - Handles rating deletions and maintains accuracy

#### **Implementation Details**:
```sql
-- Automatically triggers on song_ratings table changes
-- Updates song.AverageRating and song.TotalRatings
-- Ensures real-time rating statistics without application logic
```

#### **Trigger: Album Rating Updates**
- **Names**: `after_album_rating_insert`, `after_album_rating_update`, `after_album_rating_delete`
- **Purpose**: Maintains album rating statistics similar to songs
- **Business Logic**: Identical pattern for album ratings

### 4.2 Artist Verification System

#### **Trigger: Automatic Artist Verification**
- **Name**: `verify_artist_on_20_followers`
- **Purpose**: Automatically verify artists when they reach 20 followers
- **Business Rules**:
  - Monitors `user_follows_artist` table for new follows
  - Counts current followers for the followed artist
  - Auto-verifies artists reaching 20+ followers
  - Sets verification date and status
  - Preserves manual admin verifications

#### **Implementation**:
```sql
-- Triggers on INSERT into user_follows_artist
-- Checks follower count >= 20
-- Updates artist.VerifiedStatus = 1
-- Sets DateVerified = current date
```

#### **Trigger: Automatic Artist Unverification**
- **Name**: `unverify_artist_below_20_followers`
- **Purpose**: Remove verification when artists drop below 20 followers
- **Business Rules**:
  - Only removes auto-verification (preserves manual admin verification)
  - Maintains verification integrity
  - Triggers on follower removal

### 4.3 Content Management and Cleanup

#### **Trigger: Song Deletion Cleanup**
- **Name**: `remove_song_from_playlists_on_delete`
- **Purpose**: Comprehensive cleanup when songs are deleted
- **Actions Performed**:
  - Removes song from all playlists
  - Deletes all user likes for the song
  - Removes listening history entries
  - Maintains referential integrity

#### **Trigger: Album Deletion Cascade**
- **Name**: `delete_songs_on_album_delete`
- **Purpose**: Properly handle album deletions
- **Actions**:
  - Deletes all songs in the album
  - Cascades to song deletion trigger
  - Ensures complete cleanup of album-related data

### 4.4 Automated Content Curation

#### **Trigger: Hit Songs Playlist**
- **Name**: `add_to_hit_songs_on_million_listens`
- **Purpose**: Automatically curate popular content
- **Business Logic**:
  - Monitors song listen counts
  - Creates "Hit Songs" playlist if none exists
  - Automatically adds songs reaching 1 million plays
  - Maintains playlist position ordering
  - Uses system admin account for playlist ownership

#### **Implementation Details**:
```sql
-- Triggers when ListenCount >= 1,000,000
-- Creates playlist if doesn't exist
-- Adds song to playlist with proper position
-- Prevents duplicate additions
```

### 4.5 User Activity Management

#### **Trigger: Default Notification Settings**
- **Name**: `create_default_notification_settings`
- **Purpose**: Ensure all users have notification preferences
- **Actions**:
  - Creates default notification settings for new users
  - Sets reasonable defaults for notification types
  - Ensures no user exists without notification preferences

#### **Trigger: Artist Notification System**
- **Name**: `notify_followers_new_song`
- **Purpose**: Automatic fan engagement system
- **Business Logic**:
  - Creates notifications when artists upload new songs
  - Respects user notification preferences
  - Considers artist verification status for notifications
  - Maintains artist-fan relationship engagement

### 4.6 Data Integrity Constraints

#### **Database-Level Constraints**
- **Foreign Key Constraints**: Ensure referential integrity across all tables
- **Unique Constraints**: Prevent duplicate usernames, emails, and other unique fields
- **Check Constraints**: Validate rating values (1-5), account status values
- **Not Null Constraints**: Ensure required fields are populated

#### **Business Rule Enforcement**
- **User Type Validation**: Ensures valid user types (Listener, Artist, Administrator, Analyst)
- **Account Status Management**: Valid status transitions through triggers
- **File Upload Constraints**: Size and format validation through application logic
- **Playlist Privacy**: Proper public/private access control

---

## 5. Available Queries and Reports

The CoogMusic platform provides comprehensive querying and reporting capabilities for different user roles:

### 5.1 Music Discovery and Search

#### **General Music Queries**
- **Song Search with Filters**:
  - Filter by artist, genre, album, release date
  - Sort by popularity, rating, recent uploads
  - Pagination support for large result sets
  - Full-text search across song titles and descriptions

- **Top Songs Queries**:
  - Most listened songs (all-time and recent)
  - Highest rated songs by genre
  - Trending songs (based on recent play activity)
  - New releases and featured content

- **Artist Discovery**:
  - Browse artists by genre and popularity
  - Most followed artists
  - Verified artist listings
  - Artist recommendations based on user activity

#### **Advanced Search Features**
- **Multi-criteria Search**: Combine multiple filters
- **Fuzzy Matching**: Find content with approximate matches
- **Related Content**: Find similar songs and artists
- **Personalized Results**: Search results tailored to user preferences

### 5.2 User-Specific Queries

#### **Personal Music Library**
- **Liked Content**: Retrieve all songs, albums, playlists liked by user
- **Listening History**: Chronological play history with timestamps
- **Created Playlists**: User's personal and public playlists
- **Following List**: Artists followed by the user

#### **Recommendation Queries**
- **Similar Users**: Find users with similar taste
- **Genre Preferences**: Analyze user's genre distribution
- **Artist Recommendations**: Suggest new artists based on listening history
- **Playlist Suggestions**: Recommend playlists based on preferences

### 5.3 Artist Analytics and Reports

#### **Performance Metrics**
- **Song Statistics**:
  ```sql
  -- Example: Get song performance for an artist
  SELECT s.SongName, s.ListenCount, s.AverageRating, 
         COUNT(uls.UserID) as LikeCount
  FROM song s
  LEFT JOIN user_likes_song uls ON s.SongID = uls.SongID
  WHERE s.ArtistID = ?
  GROUP BY s.SongID
  ORDER BY s.ListenCount DESC;
  ```

- **Follower Analytics**:
  - Follower growth over time
  - Geographic distribution of fans
  - Fan engagement metrics
  - Demographic analysis of followers

#### **Revenue and Engagement Reports**
- **Top Performing Content**: Best songs and albums by metrics
- **Engagement Trends**: Play patterns and user interaction
- **Comparative Analysis**: Performance against other artists
- **Growth Metrics**: Month-over-month improvements

### 5.4 Administrative Reports

#### **User Management Queries**
- **Active User Reports**:
  ```sql
  -- Example: Get user activity summary
  SELECT u.UserType, COUNT(*) as UserCount,
         AVG(DATEDIFF(NOW(), u.LastLogin)) as AvgDaysSinceLogin
  FROM userprofile u
  WHERE u.AccountStatus = 'Active'
  GROUP BY u.UserType;
  ```

- **Account Status Distribution**: Active, suspended, banned user counts
- **User Registration Trends**: New user signups over time
- **Geographic User Distribution**: Users by country and city

#### **Content Moderation Reports**
- **Content Statistics**: Total songs, albums, playlists by date
- **Artist Verification Status**: Verified vs unverified artists
- **Popular Content**: Most engaged content across platform
- **Platform Health**: System usage and performance metrics

### 5.5 Analytics Dashboard Queries

#### **Platform-Wide Statistics**
- **Total Content Metrics**:
  - Total songs uploaded
  - Total artists registered
  - Total playlists created
  - Total play time across platform

- **Engagement Metrics**:
  ```sql
  -- Example: Platform engagement summary
  SELECT 
    (SELECT COUNT(*) FROM song) as TotalSongs,
    (SELECT COUNT(*) FROM userprofile WHERE UserType = 'Artist') as TotalArtists,
    (SELECT SUM(ListenCount) FROM song) as TotalPlays,
    (SELECT AVG(AverageRating) FROM song WHERE TotalRatings > 0) as AvgRating;
  ```

#### **Trending Analysis**
- **Daily/Weekly/Monthly Trends**: User activity patterns
- **Seasonal Analysis**: Music preference changes over time
- **Growth Metrics**: Platform growth and user acquisition
- **Performance Benchmarks**: Key performance indicators

### 5.6 Custom Report Generation

#### **Parameterized Reports**
- **Date Range Filtering**: Flexible date range selection
- **User Role Filtering**: Reports specific to user types
- **Geographic Filtering**: Reports by location
- **Content Type Filtering**: Focus on songs, albums, or playlists

#### **Export Capabilities**
- **JSON Export**: Structured data for API consumption
- **CSV Export**: Spreadsheet-compatible formats
- **Real-time Data**: Live updating dashboard metrics
- **Scheduled Reports**: Automated report generation

#### **Advanced Analytics**
- **Cohort Analysis**: User behavior over time
- **Funnel Analysis**: User conversion tracking
- **A/B Testing**: Feature performance comparison
- **Predictive Analytics**: Future trend forecasting

---

## 6. Database Schema Details

### 6.1 Core Tables Overview

The CoogMusic database consists of 15 main tables organized in a logical hierarchy:

#### **User Management Tables**
- **`userprofile`**: Core user account information
  - Primary Key: `UserID` (Auto-increment)
  - Unique Fields: `Username`, `Email`
  - User Types: Listener, Artist, Administrator, Analyst
  - Status: Active, Suspended, Banned

- **`artist`**: Extended artist profile information
  - Primary Key: `ArtistID` (references `userprofile.UserID`)
  - Fields: Bio, profile picture, verification status
  - Verification tracking: Admin ID, verification date

#### **Content Tables**
- **`genre`**: Music genre definitions
  - Contains: Pop, Rock, Hip-Hop, Electronic, Jazz, etc.
  - Pre-populated with 17 standard genres

- **`album`**: Album information and metadata
  - Links to artist, optional cover art
  - Rating aggregation fields

- **`song`**: Individual music tracks
  - File path, duration, play count
  - Rating statistics, release information
  - Genre and album associations

#### **Social and Interaction Tables**
- **`playlist`**: User-created playlists
- **`playlist_song`**: Many-to-many playlist-song relationships
- **`user_likes_song`**: Song likes tracking
- **`user_likes_album`**: Album likes tracking  
- **`user_likes_playlist`**: Playlist likes tracking
- **`user_follows_artist`**: Artist following relationships

#### **Activity Tracking Tables**
- **`listening_history`**: Comprehensive play tracking
- **`song_ratings`**: User song ratings (1-5 stars)
- **`album_ratings`**: User album ratings
- **`notifications`**: User notification system
- **`notification_settings`**: User notification preferences

### 6.2 Key Relationships and Constraints

#### **Foreign Key Relationships**
```sql
-- Artist extends User
artist.ArtistID → userprofile.UserID (CASCADE DELETE)

-- Content ownership
song.ArtistID → artist.ArtistID (CASCADE DELETE)
album.ArtistID → artist.ArtistID (CASCADE DELETE)

-- Content categorization
song.GenreID → genre.GenreID (SET NULL)
song.AlbumID → album.AlbumID (SET NULL)

-- User interactions
user_likes_song.UserID → userprofile.UserID (CASCADE DELETE)
user_likes_song.SongID → song.SongID (CASCADE DELETE)
```

#### **Index Strategy**
- **Performance Indexes**: On frequently queried fields
- **Composite Indexes**: For multi-column searches
- **Unique Indexes**: Enforcing business rules

### 6.3 Data Types and Storage

#### **File Storage Strategy**
- **Music Files**: Local filesystem with database path references
- **Profile Pictures**: LONGBLOB for small images, filesystem for larger
- **Metadata Storage**: JSON fields for flexible content information

#### **Timestamp Management**
- **Automatic Timestamps**: `CreatedAt`, `UpdatedAt` for all major tables
- **User Activity**: `LastLogin`, `ListenedAt` for tracking
- **Content Dates**: `ReleaseDate`, `DateJoined` for chronological data

---

## 7. Test Accounts

For evaluation and testing purposes, the following accounts are available:

### 7.1 Listener Accounts
```
Username: listener1
Password: password123
Role: Listener
Features: Can stream music, create playlists, like content, follow artists

Username: listener2  
Password: password123
Role: Listener
Features: Second test account for social feature testing
```

### 7.2 Artist Accounts
```
Username: artist1
Password: password123
Role: Artist
Features: Can upload music, create albums, view artist analytics, all listener features

Username: artist2
Password: password123  
Role: Artist
Features: Second artist account for multi-artist testing
```

### 7.3 Administrator Account
```
Username: admin1
Password: password123
Role: Administrator
Features: User management, artist verification, system oversight, platform analytics
```

### 7.4 Analyst Account
```
Username: analyst1
Password: password123
Role: Analyst
Features: Advanced analytics access, reporting capabilities, data export functions
```

### 7.5 Test Scenarios

#### **Basic Functionality Testing**
1. Login with each account type to verify role-specific features
2. Test music upload as artist accounts
3. Create playlists as listener accounts
4. Verify admin functions with administrator account

#### **Social Feature Testing**
1. Follow artists using listener accounts
2. Like songs and albums across different users
3. Test notification system between artists and followers

#### **Analytics Testing**
1. Generate reports using analyst account
2. View artist-specific analytics as artist accounts
3. Test administrative analytics as admin

---

## Conclusion

CoogMusic represents a comprehensive database application demonstrating advanced database concepts including:

- **Complex Relational Schema**: 15+ interconnected tables with proper normalization
- **Automated Business Logic**: 8+ triggers implementing semantic constraints
- **Role-Based Access Control**: 4 distinct user types with specific permissions
- **Rich Query Capabilities**: Complex analytics and reporting functionality
- **Data Integrity**: Comprehensive constraints and cascading relationships

The platform successfully implements a real-world music streaming application with enterprise-level database design patterns and sophisticated user management systems.