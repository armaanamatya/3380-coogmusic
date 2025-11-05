import { Pool, RowDataPacket } from 'mysql2/promise';

export interface AnalyticsFilters {
  startDate: string;
  endDate: string;
  includeListeners: boolean;
  includeArtists: boolean;
  includePlaylistStatistics: boolean;
  includeAlbumStatistics: boolean;
  includeGeographics: boolean;
}

export interface UserCount {
  listeners: number;
  artists: number;
  ratio?: string | undefined;
}

export interface LoginCount {
  listeners: number;
  artists: number;
  ratio?: string | undefined;
}

export interface LoginTime {
  listeners: { total: number; average: number };
  artists: { total: number; average: number };
  all: { total: number; average: number };
}

export interface PlaylistStats {
  totalCreated: number;
  privatePlaylists: number;
  publicPlaylists: number;
  ratio: string;
  totalLiked: number;
  distinctLiked: number;
}

export interface AlbumStats {
  totalLiked: number;
  distinctLiked: number;
  totalCreated: number;
}

export interface AgeDemographics {
  range: string;
  count: number;
  ratio: string;
}

export interface CountryStats {
  country: string;
  count: number;
  ratio: string;
}

export interface AnalyticsReport {
  userCounts: UserCount;
  loginCounts: LoginCount;
  loginTime: LoginTime;
  songsListened: number;
  songsUploaded: number;
  playlistStats?: PlaylistStats;
  albumStats?: AlbumStats;
  songsLiked: number;
  distinctSongsLiked: number;
  artistsFollowed: number;
  distinctArtistsFollowed: number;
  ageDemographics: AgeDemographics[];
  countryStats?: CountryStats[];
}

// Get user counts by type
export async function getUserCounts(
  pool: Pool,
  filters: AnalyticsFilters
): Promise<UserCount> {
  const { startDate, endDate, includeListeners, includeArtists } = filters;
  
  let query = `
    SELECT 
      SUM(CASE WHEN UserType = 'Listener' THEN 1 ELSE 0 END) as listeners,
      SUM(CASE WHEN UserType = 'Artist' THEN 1 ELSE 0 END) as artists
    FROM userprofile
    WHERE UserType IN ('Listener', 'Artist')
      AND UserType != 'Analyst'
      AND DateJoined >= ? AND DateJoined <= ?
  `;
  
  const [rows] = await pool.execute<RowDataPacket[]>(query, [startDate, endDate]);
  const result = rows[0] as { listeners: number; artists: number };
  
  let listeners = 0;
  let artists = 0;
  let ratio: string | undefined;
  
  if (includeListeners && includeArtists) {
    listeners = result.listeners || 0;
    artists = result.artists || 0;
    if (artists > 0) {
      const ratioValue = (listeners / artists).toFixed(2);
      ratio = `${ratioValue}:1 (Listeners:Artists)`;
    } else if (listeners > 0) {
      ratio = 'N/A (No artists)';
    }
  } else if (includeListeners) {
    listeners = result.listeners || 0;
  } else if (includeArtists) {
    artists = result.artists || 0;
  }
  
  return { listeners, artists, ratio };
}

// Get login counts by type
export async function getLoginCounts(
  pool: Pool,
  filters: AnalyticsFilters
): Promise<LoginCount> {
  const { startDate, endDate, includeListeners, includeArtists } = filters;
  
  let query = `
    SELECT 
      SUM(CASE WHEN up.UserType = 'Listener' THEN 1 ELSE 0 END) as listeners,
      SUM(CASE WHEN up.UserType = 'Artist' THEN 1 ELSE 0 END) as artists
    FROM user_logins ul
    JOIN userprofile up ON ul.UserID = up.UserID
    WHERE up.UserType IN ('Listener', 'Artist')
      AND up.UserType != 'Analyst'
      AND ul.LoginDate >= ? AND ul.LoginDate <= ?
  `;
  
  const [rows] = await pool.execute<RowDataPacket[]>(query, [startDate, endDate]);
  const result = rows[0] as { listeners: number; artists: number };
  
  let listeners = 0;
  let artists = 0;
  let ratio: string | undefined;
  
  if (includeListeners && includeArtists) {
    listeners = result.listeners || 0;
    artists = result.artists || 0;
    if (artists > 0) {
      const ratioValue = (listeners / artists).toFixed(2);
      ratio = `${ratioValue}:1 (Listeners:Artists)`;
    } else if (listeners > 0) {
      ratio = 'N/A (No artist logins)';
    }
  } else if (includeListeners) {
    listeners = result.listeners || 0;
  } else if (includeArtists) {
    artists = result.artists || 0;
  }
  
  return { listeners, artists, ratio };
}

// Get total login time
export async function getLoginTime(
  pool: Pool,
  filters: AnalyticsFilters
): Promise<LoginTime> {
  const { startDate, endDate, includeListeners, includeArtists } = filters;
  
  const query = `
    SELECT 
      up.UserType,
      SUM(ul.LoginSession) as totalTime,
      COUNT(DISTINCT ul.UserID) as userCount
    FROM user_logins ul
    JOIN userprofile up ON ul.UserID = up.UserID
    WHERE up.UserType IN ('Listener', 'Artist')
      AND up.UserType != 'Analyst'
      AND ul.LoginDate >= ? AND ul.LoginDate <= ?
      AND ul.LogoutDate IS NOT NULL
      AND ul.LoginSession IS NOT NULL
    GROUP BY up.UserType
  `;
  
  const [rows] = await pool.execute<RowDataPacket[]>(query, [startDate, endDate]);
  
  let listenersTotal = 0;
  let listenersCount = 0;
  let artistsTotal = 0;
  let artistsCount = 0;
  
  for (const row of rows) {
    if (row.UserType === 'Listener') {
      listenersTotal = row.totalTime || 0;
      listenersCount = row.userCount || 0;
    } else if (row.UserType === 'Artist') {
      artistsTotal = row.totalTime || 0;
      artistsCount = row.userCount || 0;
    }
  }
  
  const listeners = {
    total: listenersTotal,
    average: listenersCount > 0 ? Math.round(listenersTotal / listenersCount) : 0
  };
  
  const artists = {
    total: artistsTotal,
    average: artistsCount > 0 ? Math.round(artistsTotal / artistsCount) : 0
  };
  
  const allTotal = listenersTotal + artistsTotal;
  const allCount = listenersCount + artistsCount;
  const all = {
    total: allTotal,
    average: allCount > 0 ? Math.round(allTotal / allCount) : 0
  };
  
  return { listeners, artists, all };
}

// Get songs listened count
export async function getSongsListened(
  pool: Pool,
  filters: AnalyticsFilters
): Promise<number> {
  const { startDate, endDate } = filters;
  
  const query = `
    SELECT SUM(SongsPlayed) as total
    FROM user_logins ul
    JOIN userprofile up ON ul.UserID = up.UserID
    WHERE up.UserType = 'Listener'
      AND ul.LoginDate >= ? AND ul.LoginDate <= ?
  `;
  
  const [rows] = await pool.execute<RowDataPacket[]>(query, [startDate, endDate]);
  return rows[0]?.total || 0;
}

// Get songs uploaded count
export async function getSongsUploaded(
  pool: Pool,
  filters: AnalyticsFilters
): Promise<number> {
  const { startDate, endDate } = filters;
  
  const query = `
    SELECT SUM(SongsUploaded) as total
    FROM user_logins ul
    JOIN userprofile up ON ul.UserID = up.UserID
    WHERE up.UserType = 'Artist'
      AND ul.LoginDate >= ? AND ul.LoginDate <= ?
  `;
  
  const [rows] = await pool.execute<RowDataPacket[]>(query, [startDate, endDate]);
  return rows[0]?.total || 0;
}

// Get playlist statistics
export async function getPlaylistStats(
  pool: Pool,
  filters: AnalyticsFilters
): Promise<PlaylistStats> {
  const { startDate, endDate } = filters;
  
  // Total created, private, public (excluding Analyst users)
  const createdQuery = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN p.IsPublic = 0 THEN 1 ELSE 0 END) as private,
      SUM(CASE WHEN p.IsPublic = 1 THEN 1 ELSE 0 END) as public
    FROM playlist p
    JOIN userprofile up ON p.UserID = up.UserID
    WHERE up.UserType != 'Analyst'
      AND p.CreatedAt >= ? AND p.CreatedAt <= ?
  `;
  
  const [createdRows] = await pool.execute<RowDataPacket[]>(createdQuery, [startDate, endDate]);
  const created = createdRows[0] as { total: number; private: number; public: number };
  
  // Total liked and distinct liked (excluding Analyst users)
  const likedQuery = `
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT ulp.PlaylistID) as distinct_count
    FROM user_likes_playlist ulp
    JOIN userprofile up ON ulp.UserID = up.UserID
    WHERE up.UserType != 'Analyst'
      AND ulp.LikedAt >= ? AND ulp.LikedAt <= ?
  `;
  
  const [likedRows] = await pool.execute<RowDataPacket[]>(likedQuery, [startDate, endDate]);
  const liked = likedRows[0] as { total: number; distinct_count: number };
  
  const privateCount = created.private || 0;
  const publicCount = created.public || 0;
  let ratio = 'N/A';
  if (privateCount > 0 && publicCount > 0) {
    const ratioValue = (publicCount / privateCount).toFixed(2);
    ratio = `${ratioValue}:1 (Public:Private)`;
  } else if (publicCount > 0) {
    ratio = 'N/A (No private playlists)';
  } else if (privateCount > 0) {
    ratio = 'N/A (No public playlists)';
  }
  
  return {
    totalCreated: created.total || 0,
    privatePlaylists: privateCount,
    publicPlaylists: publicCount,
    ratio,
    totalLiked: liked.total || 0,
    distinctLiked: liked.distinct_count || 0
  };
}

// Get album statistics
export async function getAlbumStats(
  pool: Pool,
  filters: AnalyticsFilters
): Promise<AlbumStats> {
  const { startDate, endDate } = filters;
  
  // Total liked and distinct liked (excluding Analyst users)
  const likedQuery = `
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT ula.AlbumID) as distinct_count
    FROM user_likes_album ula
    JOIN userprofile up ON ula.UserID = up.UserID
    WHERE up.UserType != 'Analyst'
      AND ula.LikedAt >= ? AND ula.LikedAt <= ?
  `;
  
  const [likedRows] = await pool.execute<RowDataPacket[]>(likedQuery, [startDate, endDate]);
  const liked = likedRows[0] as { total: number; distinct_count: number };
  
  // Total created (excluding Analyst users)
  const createdQuery = `
    SELECT COUNT(*) as total
    FROM album a
    JOIN artist ar ON a.ArtistID = ar.ArtistID
    JOIN userprofile up ON ar.ArtistID = up.UserID
    WHERE up.UserType != 'Analyst'
      AND a.CreatedAt >= ? AND a.CreatedAt <= ?
  `;
  
  const [createdRows] = await pool.execute<RowDataPacket[]>(createdQuery, [startDate, endDate]);
  const created = createdRows[0] as { total: number };
  
  return {
    totalLiked: liked.total || 0,
    distinctLiked: liked.distinct_count || 0,
    totalCreated: created.total || 0
  };
}

// Get songs liked statistics
export async function getSongsLikedStats(
  pool: Pool,
  filters: AnalyticsFilters
): Promise<{ total: number; distinct: number }> {
  const { startDate, endDate } = filters;
  
  const query = `
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT uls.SongID) as distinct_count
    FROM user_likes_song uls
    JOIN userprofile up ON uls.UserID = up.UserID
    WHERE up.UserType != 'Analyst'
      AND uls.LikedAt >= ? AND uls.LikedAt <= ?
  `;
  
  const [rows] = await pool.execute<RowDataPacket[]>(query, [startDate, endDate]);
  const result = rows[0] as { total: number; distinct_count: number };
  
  return {
    total: result.total || 0,
    distinct: result.distinct_count || 0
  };
}

// Get artists followed statistics
export async function getArtistsFollowedStats(
  pool: Pool,
  filters: AnalyticsFilters
): Promise<{ total: number; distinct: number }> {
  const { startDate, endDate } = filters;
  
  const query = `
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT ufa.ArtistID) as distinct_count
    FROM user_follows_artist ufa
    JOIN userprofile up ON ufa.UserID = up.UserID
    WHERE up.UserType != 'Analyst'
      AND ufa.FollowedAt >= ? AND ufa.FollowedAt <= ?
  `;
  
  const [rows] = await pool.execute<RowDataPacket[]>(query, [startDate, endDate]);
  const result = rows[0] as { total: number; distinct_count: number };
  
  return {
    total: result.total || 0,
    distinct: result.distinct_count || 0
  };
}

// Get age demographics
export async function getAgeDemographics(
  pool: Pool,
  filters: AnalyticsFilters
): Promise<AgeDemographics[]> {
  const { startDate, endDate, includeListeners, includeArtists } = filters;
  
  const userTypes: string[] = [];
  if (includeListeners) userTypes.push('Listener');
  if (includeArtists) userTypes.push('Artist');
  
  if (userTypes.length === 0) return [];
  
  const placeholders = userTypes.map(() => '?').join(',');
  
  const query = `
    SELECT 
      CASE 
        WHEN TIMESTAMPDIFF(YEAR, DateOfBirth, CURDATE()) < 18 THEN '<18'
        WHEN TIMESTAMPDIFF(YEAR, DateOfBirth, CURDATE()) BETWEEN 18 AND 24 THEN '18-24'
        WHEN TIMESTAMPDIFF(YEAR, DateOfBirth, CURDATE()) BETWEEN 25 AND 34 THEN '25-34'
        WHEN TIMESTAMPDIFF(YEAR, DateOfBirth, CURDATE()) BETWEEN 35 AND 44 THEN '35-44'
        WHEN TIMESTAMPDIFF(YEAR, DateOfBirth, CURDATE()) BETWEEN 45 AND 54 THEN '45-54'
        ELSE '>55'
      END as age_range,
      COUNT(*) as count
    FROM userprofile
    WHERE UserType IN (${placeholders})
      AND DateJoined >= ? AND DateJoined <= ?
    GROUP BY age_range
    ORDER BY 
      CASE age_range
        WHEN '<18' THEN 1
        WHEN '18-24' THEN 2
        WHEN '25-34' THEN 3
        WHEN '35-44' THEN 4
        WHEN '45-54' THEN 5
        WHEN '>55' THEN 6
      END
  `;
  
  const [rows] = await pool.execute<RowDataPacket[]>(
    query, 
    [...userTypes, startDate, endDate]
  );
  
  const total = rows.reduce((sum, row) => sum + (row.count || 0), 0);
  
  return rows.map((row: any) => ({
    range: row.age_range,
    count: row.count || 0,
    ratio: total > 0 ? `${((row.count / total) * 100).toFixed(2)}%` : '0%'
  }));
}

// Get top 5 countries
export async function getCountryStats(
  pool: Pool,
  filters: AnalyticsFilters
): Promise<CountryStats[]> {
  const { startDate, endDate, includeListeners, includeArtists } = filters;
  
  const userTypes: string[] = [];
  if (includeListeners) userTypes.push('Listener');
  if (includeArtists) userTypes.push('Artist');
  
  if (userTypes.length === 0) return [];
  
  const placeholders = userTypes.map(() => '?').join(',');
  
  const query = `
    SELECT 
      Country,
      COUNT(*) as count
    FROM userprofile
    WHERE UserType IN (${placeholders})
      AND DateJoined >= ? AND DateJoined <= ?
    GROUP BY Country
    ORDER BY count DESC
    LIMIT 5
  `;
  
  const [rows] = await pool.execute<RowDataPacket[]>(
    query,
    [...userTypes, startDate, endDate]
  );
  
  const total = rows.reduce((sum, row) => sum + (row.count || 0), 0);
  
  // Country abbreviation mapping (simplified - you may want to expand this)
  const countryAbbrev: { [key: string]: string } = {
    'United States': 'US',
    'United Kingdom': 'UK',
    'Canada': 'CA',
    'Australia': 'AU',
    'Germany': 'DE',
    'France': 'FR',
    'Spain': 'ES',
    'Italy': 'IT',
    'Brazil': 'BR',
    'Mexico': 'MX',
    'Japan': 'JP',
    'China': 'CN',
    'India': 'IN'
  };
  
  return rows.map((row: any) => {
    const country = row.Country || '';
    const abbrev = countryAbbrev[country] || country.substring(0, 2).toUpperCase();
    return {
      country: abbrev,
      count: row.count || 0,
      ratio: total > 0 ? `${((row.count / total) * 100).toFixed(1)}%` : '0%'
    };
  });
}

// Get complete analytics report
export async function getAnalyticsReport(
  pool: Pool,
  filters: AnalyticsFilters
): Promise<AnalyticsReport> {
  const [
    userCounts,
    loginCounts,
    loginTime,
    songsListened,
    songsUploaded,
    songsLikedStats,
    artistsFollowedStats,
    ageDemographics
  ] = await Promise.all([
    getUserCounts(pool, filters),
    getLoginCounts(pool, filters),
    getLoginTime(pool, filters),
    getSongsListened(pool, filters),
    getSongsUploaded(pool, filters),
    getSongsLikedStats(pool, filters),
    getArtistsFollowedStats(pool, filters),
    getAgeDemographics(pool, filters)
  ]);
  
  const report: AnalyticsReport = {
    userCounts,
    loginCounts,
    loginTime,
    songsListened,
    songsUploaded,
    songsLiked: songsLikedStats.total,
    distinctSongsLiked: songsLikedStats.distinct,
    artistsFollowed: artistsFollowedStats.total,
    distinctArtistsFollowed: artistsFollowedStats.distinct,
    ageDemographics
  };
  
  if (filters.includePlaylistStatistics) {
    report.playlistStats = await getPlaylistStats(pool, filters);
  }
  
  if (filters.includeAlbumStatistics) {
    report.albumStats = await getAlbumStats(pool, filters);
  }
  
  if (filters.includeGeographics) {
    report.countryStats = await getCountryStats(pool, filters);
  }
  
  return report;
}

// Individual User Analytics Interfaces
export interface IndividualUserReport {
  userInfo: {
    dateCreated: string;
    country: string;
    city: string | null;
    age: number;
  };
  loginStats: {
    totalLogins: number;
    totalTimeLoggedIn: number;
    averageTimeLoggedIn: number;
  };
  listenerStats?: {
    totalSongsPlayed: number;
    distinctSongsPlayed: number;
    playlistsCreated: {
      total: number;
      public: number;
      private: number;
    };
    playlistsLiked: number;
    topSongs: Array<{ songName: string; playCount: number }>;
    songsLiked: number;
    totalListeningDuration: number;
    averageListeningDuration: number;
    albumsLiked: number;
  };
  artistStats?: {
    totalSongPlays: number;
    distinctSongsPlayed: number;
    songsAddedToPlaylists: number;
    distinctSongsAddedToPlaylists: number;
    albumsCreated: number;
    totalAlbumLikes: number;
    distinctAlbumsLiked: number;
    totalListeningDuration: number;
    averageListeningDuration: number;
    topSongs: Array<{ songName: string; playCount: number }>;
    genreDistribution: Array<{ genre: string; percentage: string }>;
  };
}

// Get individual user analytics report
export async function getIndividualUserReport(
  pool: Pool,
  username: string,
  startDate: string,
  endDate: string
): Promise<IndividualUserReport | null> {
  // First, get the user - trim whitespace and use case-insensitive matching
  const trimmedUsername = username.trim();
  
  // Try exact match first, then case-insensitive match
  let userQuery = `
    SELECT UserID, UserType, DateJoined, Country, City, DateOfBirth
    FROM userprofile
    WHERE Username = ? AND UserType != 'Analyst'
  `;
  
  let [userRows] = await pool.execute<RowDataPacket[]>(userQuery, [trimmedUsername]);
  
  // If no exact match, try case-insensitive
  if (userRows.length === 0) {
    userQuery = `
      SELECT UserID, UserType, DateJoined, Country, City, DateOfBirth
      FROM userprofile
      WHERE LOWER(Username) = LOWER(?) AND UserType != 'Analyst'
    `;
    [userRows] = await pool.execute<RowDataPacket[]>(userQuery, [trimmedUsername]);
  }
  
  if (userRows.length === 0) {
    // Debug: Check if user exists at all (even if Analyst)
    const debugQuery = `SELECT UserID, Username, UserType FROM userprofile WHERE LOWER(Username) = LOWER(?)`;
    const [debugRows] = await pool.execute<RowDataPacket[]>(debugQuery, [trimmedUsername]);
    if (debugRows.length > 0) {
      const foundUser = debugRows[0];
      if (foundUser) {
        console.error(`User found but filtered out: "${trimmedUsername}" (UserID: ${foundUser.UserID}, UserType: ${foundUser.UserType})`);
        throw new Error(`User "${trimmedUsername}" is an Analyst and cannot be analyzed. Only Listener and Artist users can be analyzed.`);
      }
    } else {
      console.error(`User not found in database: "${trimmedUsername}" (original: "${username}")`);
      throw new Error(`User "${trimmedUsername}" not found. Please check the username and try again.`);
    }
  }
  
  const user = userRows[0];
  if (!user) {
    throw new Error(`User "${trimmedUsername}" not found. Please check the username and try again.`);
  }
  
  const userId = user.UserID;
  const userType = user.UserType;
  const dateJoined = user.DateJoined;
  const country = user.Country || '';
  const city = user.City || null;
  
  // Calculate age
  const ageQuery = `
    SELECT TIMESTAMPDIFF(YEAR, DateOfBirth, CURDATE()) as age
    FROM userprofile
    WHERE UserID = ?
  `;
  const [ageRows] = await pool.execute<RowDataPacket[]>(ageQuery, [userId]);
  const age = ageRows[0]?.age || 0;
  
  // Get login stats
  const loginQuery = `
    SELECT 
      COUNT(*) as totalLogins,
      SUM(LoginSession) as totalTime,
      AVG(LoginSession) as avgTime
    FROM user_logins
    WHERE UserID = ? 
      AND LoginDate >= ? AND LoginDate <= ?
      AND LogoutDate IS NOT NULL
      AND LoginSession IS NOT NULL
  `;
  const [loginRows] = await pool.execute<RowDataPacket[]>(loginQuery, [userId, startDate, endDate]);
  const loginStats = {
    totalLogins: loginRows[0]?.totalLogins || 0,
    totalTimeLoggedIn: loginRows[0]?.totalTime || 0,
    averageTimeLoggedIn: Math.round(loginRows[0]?.avgTime || 0)
  };
  
  const report: IndividualUserReport = {
    userInfo: {
      dateCreated: dateJoined,
      country,
      city,
      age
    },
    loginStats
  };
  
  if (userType === 'Listener') {
    // Get listener-specific stats
    const songsPlayedQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT SongID) as distinct_count
      FROM listening_history
      WHERE UserID = ? 
        AND ListenedAt >= ? AND ListenedAt <= ?
    `;
    const [songsPlayedRows] = await pool.execute<RowDataPacket[]>(songsPlayedQuery, [userId, startDate, endDate]);
    
    // Playlists created
    const playlistsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN IsPublic = 0 THEN 1 ELSE 0 END) as private,
        SUM(CASE WHEN IsPublic = 1 THEN 1 ELSE 0 END) as public
      FROM playlist
      WHERE UserID = ?
        AND CreatedAt >= ? AND CreatedAt <= ?
    `;
    const [playlistsRows] = await pool.execute<RowDataPacket[]>(playlistsQuery, [userId, startDate, endDate]);
    
    // Playlists liked
    const playlistsLikedQuery = `
      SELECT COUNT(*) as total
      FROM user_likes_playlist
      WHERE UserID = ?
        AND LikedAt >= ? AND LikedAt <= ?
    `;
    const [playlistsLikedRows] = await pool.execute<RowDataPacket[]>(playlistsLikedQuery, [userId, startDate, endDate]);
    
    // Top 5 songs
    const topSongsQuery = `
      SELECT 
        s.SongName,
        COUNT(*) as playCount
      FROM listening_history lh
      JOIN song s ON lh.SongID = s.SongID
      WHERE lh.UserID = ?
        AND lh.ListenedAt >= ? AND lh.ListenedAt <= ?
      GROUP BY s.SongID, s.SongName
      ORDER BY playCount DESC
      LIMIT 5
    `;
    const [topSongsRows] = await pool.execute<RowDataPacket[]>(topSongsQuery, [userId, startDate, endDate]);
    
    // Songs liked
    const songsLikedQuery = `
      SELECT COUNT(*) as total
      FROM user_likes_song
      WHERE UserID = ?
        AND LikedAt >= ? AND LikedAt <= ?
    `;
    const [songsLikedRows] = await pool.execute<RowDataPacket[]>(songsLikedQuery, [userId, startDate, endDate]);
    
    // Total listening duration
    const durationQuery = `
      SELECT 
        SUM(Duration) as total,
        AVG(Duration) as avg
      FROM listening_history
      WHERE UserID = ?
        AND ListenedAt >= ? AND ListenedAt <= ?
        AND Duration IS NOT NULL
    `;
    const [durationRows] = await pool.execute<RowDataPacket[]>(durationQuery, [userId, startDate, endDate]);
    
    // Albums liked
    const albumsLikedQuery = `
      SELECT COUNT(*) as total
      FROM user_likes_album
      WHERE UserID = ?
        AND LikedAt >= ? AND LikedAt <= ?
    `;
    const [albumsLikedRows] = await pool.execute<RowDataPacket[]>(albumsLikedQuery, [userId, startDate, endDate]);
    
    report.listenerStats = {
      totalSongsPlayed: songsPlayedRows[0]?.total || 0,
      distinctSongsPlayed: songsPlayedRows[0]?.distinct_count || 0,
      playlistsCreated: {
        total: playlistsRows[0]?.total || 0,
        public: playlistsRows[0]?.public || 0,
        private: playlistsRows[0]?.private || 0
      },
      playlistsLiked: playlistsLikedRows[0]?.total || 0,
      topSongs: topSongsRows.map((row: any) => ({
        songName: row.SongName,
        playCount: row.playCount
      })),
      songsLiked: songsLikedRows[0]?.total || 0,
      totalListeningDuration: durationRows[0]?.total || 0,
      averageListeningDuration: Math.round(durationRows[0]?.avg || 0),
      albumsLiked: albumsLikedRows[0]?.total || 0
    };
  } else if (userType === 'Artist') {
    // Get artist ID
    const artistQuery = `
      SELECT ArtistID
      FROM artist
      WHERE ArtistID = ?
    `;
    const [artistRows] = await pool.execute<RowDataPacket[]>(artistQuery, [userId]);
    if (artistRows.length === 0 || !artistRows[0]) {
      return report;
    }
    const artistId = artistRows[0].ArtistID;
    
    // Total song plays (by other users)
    const songPlaysQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT lh.SongID) as distinct_count
      FROM listening_history lh
      JOIN song s ON lh.SongID = s.SongID
      WHERE s.ArtistID = ?
        AND lh.ListenedAt >= ? AND lh.ListenedAt <= ?
    `;
    const [songPlaysRows] = await pool.execute<RowDataPacket[]>(songPlaysQuery, [artistId, startDate, endDate]);
    
    // Songs added to playlists (by other users)
    const songsInPlaylistsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT ps.SongID) as distinct_count
      FROM playlist_song ps
      JOIN song s ON ps.SongID = s.SongID
      WHERE s.ArtistID = ?
        AND ps.AddedAt >= ? AND ps.AddedAt <= ?
    `;
    const [songsInPlaylistsRows] = await pool.execute<RowDataPacket[]>(songsInPlaylistsQuery, [artistId, startDate, endDate]);
    
    // Albums created
    const albumsCreatedQuery = `
      SELECT COUNT(*) as total
      FROM album
      WHERE ArtistID = ?
        AND CreatedAt >= ? AND CreatedAt <= ?
    `;
    const [albumsCreatedRows] = await pool.execute<RowDataPacket[]>(albumsCreatedQuery, [artistId, startDate, endDate]);
    
    // Album likes (by other users)
    const albumLikesQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT ula.AlbumID) as distinct_count
      FROM user_likes_album ula
      JOIN album a ON ula.AlbumID = a.AlbumID
      WHERE a.ArtistID = ?
        AND ula.LikedAt >= ? AND ula.LikedAt <= ?
    `;
    const [albumLikesRows] = await pool.execute<RowDataPacket[]>(albumLikesQuery, [artistId, startDate, endDate]);
    
    // Total listening duration
    const durationQuery = `
      SELECT 
        SUM(lh.Duration) as total,
        AVG(lh.Duration) as avg
      FROM listening_history lh
      JOIN song s ON lh.SongID = s.SongID
      WHERE s.ArtistID = ?
        AND lh.ListenedAt >= ? AND lh.ListenedAt <= ?
        AND lh.Duration IS NOT NULL
    `;
    const [durationRows] = await pool.execute<RowDataPacket[]>(durationQuery, [artistId, startDate, endDate]);
    
    // Top 5 songs by plays
    const topSongsQuery = `
      SELECT 
        s.SongName,
        COUNT(*) as playCount
      FROM listening_history lh
      JOIN song s ON lh.SongID = s.SongID
      WHERE s.ArtistID = ?
        AND lh.ListenedAt >= ? AND lh.ListenedAt <= ?
      GROUP BY s.SongID, s.SongName
      ORDER BY playCount DESC
      LIMIT 5
    `;
    const [topSongsRows] = await pool.execute<RowDataPacket[]>(topSongsQuery, [artistId, startDate, endDate]);
    
    // Genre distribution
    const genreQuery = `
      SELECT 
        g.GenreName,
        COUNT(s.SongID) as songCount
      FROM song s
      JOIN genre g ON s.GenreID = g.GenreID
      WHERE s.ArtistID = ?
      GROUP BY g.GenreID, g.GenreName
    `;
    const [genreRows] = await pool.execute<RowDataPacket[]>(genreQuery, [artistId]);
    const totalSongs = genreRows.reduce((sum: number, row: any) => sum + (row.songCount || 0), 0);
    
    report.artistStats = {
      totalSongPlays: songPlaysRows[0]?.total || 0,
      distinctSongsPlayed: songPlaysRows[0]?.distinct_count || 0,
      songsAddedToPlaylists: songsInPlaylistsRows[0]?.total || 0,
      distinctSongsAddedToPlaylists: songsInPlaylistsRows[0]?.distinct_count || 0,
      albumsCreated: albumsCreatedRows[0]?.total || 0,
      totalAlbumLikes: albumLikesRows[0]?.total || 0,
      distinctAlbumsLiked: albumLikesRows[0]?.distinct_count || 0,
      totalListeningDuration: durationRows[0]?.total || 0,
      averageListeningDuration: Math.round(durationRows[0]?.avg || 0),
      topSongs: topSongsRows.map((row: any) => ({
        songName: row.SongName,
        playCount: row.playCount
      })),
      genreDistribution: genreRows.map((row: any) => ({
        genre: row.GenreName,
        percentage: totalSongs > 0 ? `${((row.songCount / totalSongs) * 100).toFixed(2)}%` : '0%'
      }))
    };
  }
  
  return report;
}

