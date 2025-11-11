import { Pool, RowDataPacket } from 'mysql2/promise';

const FALLBACK_SONG_DURATION = 180;

export interface AnalyticsFilters {
  startDate: string;
  endDate: string;
  includeListeners: boolean;
  includeArtists: boolean;
  includePlaylistStatistics: boolean;
  includeAlbumStatistics: boolean;
  includeGeographics: boolean;
  includeSuspendedAccounts?: boolean;
  showSongStats?: boolean;
  showArtistStats?: boolean;
  showAgeDemographics?: boolean;
}

export interface UserCount {
  listeners: number;
  artists: number;
  ratio?: string;
}

export interface LoginCount {
  listeners: number;
  artists: number;
  ratio?: string;
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

export interface UserSummary {
  username: string;
  firstName: string;
  lastName: string;
  age: number | null;
  dateOfBirth: string | null;
  email: string;
  dateJoined: string;
  country: string;
  city: string | null;
  totalLogins: number;
  totalLoginTime: number;
  averageLoginTime: number;
  totalSongsPlayed: number;
  distinctSongsPlayed: number;
  songsLiked: number;
  artistsFollowed: number;
  playlistsCreated: number;
  albumsLiked: number;
  songsReleased: number;
  albumsReleased: number;
  activityScore: number;
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
  listenerUsers?: UserSummary[];
  artistUsers?: UserSummary[];
  showSongStats: boolean;
  showArtistStats: boolean;
  showAgeDemographics: boolean;
  songActivity?: SongActivity[];
  artistActivity?: ArtistActivity[];
  albumActivity?: AlbumActivity[];
  playlistActivity?: PlaylistActivityResult;
  includeSuspendedAccounts: boolean;
}

const EXCLUDED_USERNAMES = ['joshtest', 'artist', 'test', 'test1', 'poop'];

const buildExcludedUsernameFilter = (column: string) => {
  if (EXCLUDED_USERNAMES.length === 0) {
    return { clause: '', params: [] as string[] };
  }
  const placeholders = EXCLUDED_USERNAMES.map(() => '?').join(', ');
  return {
    clause: `\n      AND LOWER(${column}) NOT IN (${placeholders})`,
    params: EXCLUDED_USERNAMES.map((name) => name.toLowerCase())
  };
};

const buildAccountStatusFilter = (
  column: string,
  includeSuspendedAccounts?: boolean
) => {
  if (includeSuspendedAccounts) {
    return '';
  }
  return `\n      AND ${column} = 'Active'`;
};

const normalizeCity = (value: any): string | null => {
  if (value == null) return null;
  const cleaned = String(value).trim();
  if (!cleaned) return null;
  const lower = cleaned.toLowerCase();
  if (lower === 'nowhere' || lower === 'anywhere') return null;
  return cleaned;
};

const mapUserSummary = (row: any): UserSummary => {
  const songsReleased = Number(row.SongsReleased || 0);
  const albumsReleased = Number(row.AlbumsReleased || 0);
  const normalizedSongsReleased = Math.max(songsReleased, albumsReleased > 0 ? 1 : 0, albumsReleased);

  return {
    username: row.Username || '',
    firstName: row.FirstName || '',
    lastName: row.LastName || '',
    age: typeof row.Age === 'number' ? row.Age : row.Age != null ? Number(row.Age) : null,
    dateOfBirth: row.DateOfBirth ? new Date(row.DateOfBirth).toISOString() : null,
    email: row.Email || '',
    dateJoined: row.DateJoined ? new Date(row.DateJoined).toISOString() : '',
    country: row.Country || '',
    city: normalizeCity(row.City),
    totalLogins: Number(row.TotalLogins || 0),
    totalLoginTime: Number(row.TotalLoginTime || 0),
    averageLoginTime: Number(row.AverageLoginTime || 0),
    totalSongsPlayed: Number(row.TotalSongsPlayed || 0),
    distinctSongsPlayed: Number(row.DistinctSongsPlayed || 0),
    songsLiked: Number(row.SongsLiked || 0),
    artistsFollowed: Number(row.ArtistsFollowed || 0),
    playlistsCreated: Number(row.PlaylistsCreated || 0),
    albumsLiked: Number(row.AlbumsLiked || 0),
    songsReleased: normalizedSongsReleased,
    albumsReleased,
    activityScore: 0
  };
};

interface SongListenerDetail {
  userId: number;
  username: string;
  email: string;
  country: string | null;
  listenCount: number;
  totalDuration: number;
  averageDuration: number;
  liked: boolean;
  likedAt?: string | null;
}

interface SongActivity {
  songId: number;
  songName: string;
  artistName: string;
  releaseDate: string | null;
  genre: string | null;
  duration: number | null;
  totalListens: number;
  totalLikes: number;
  totalListeningTime: number;
  averageListeningTime: number;
  listenerDetails: SongListenerDetail[];
}

interface ArtistAlbumSongDetail {
  songId: number;
  songName: string;
  duration: number | null;
  genre: string | null;
}

interface AlbumLikeDetail {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  likedAt: string | null;
}

interface AlbumActivity {
  albumId: number;
  albumName: string;
  artistId: number;
  artistUsername: string;
  artistName: string;
  releaseDate: string | null;
  totalDuration: number;
  songCount: number;
  genre: string | null;
  likes: number;
  listens: number;
  songs: ArtistAlbumSongDetail[];
  likedBy: AlbumLikeDetail[];
}

interface PlaylistSongDetail {
  songId: number;
  songName: string;
  artistName: string;
  albumName: string | null;
  addedAt: string | null;
  duration: number | null;
}

interface PlaylistLikeDetail {
  userId: number;
  username: string;
  likedAt: string | null;
}

interface PlaylistActivity {
  playlistId: number;
  playlistName: string;
  isPublic: boolean;
  ownerUsername: string;
  createdAt: string | null;
  songCount: number;
  totalDuration: number;
  likes: number;
  songs: PlaylistSongDetail[];
  likedBy: PlaylistLikeDetail[];
}

interface PlaylistActivityResult {
  publicPlaylists: PlaylistActivity[];
  privatePlaylists: PlaylistActivity[];
}

interface ArtistActivity {
  artistId: number;
  username: string;
  firstName: string;
  lastName: string;
  age: number | null;
  profilePicture: string | null;
  verified: boolean;
  dateVerified: string | null;
  dateJoined: string;
  country: string | null;
  city: string | null;
  songsReleased: number;
  albumsReleased: number;
  totalListens: number;
  totalListeningDuration: number;
  totalSongLikes: number;
  totalAlbumLikes: number;
  genres: string[];
  followers: ArtistFollowerDetail[];
}

interface ArtistFollowerDetail {
  userId: number;
  username: string;
  email: string;
  followedAt: string | null;
}

interface IndividualUserArtistSongListenerDetail {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  listenCount: number;
  totalDuration: number;
  averageDuration: number;
}

interface IndividualUserArtistSongLikeDetail {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  likedAt: string | null;
}

interface IndividualUserArtistSongActivity {
  songId: number;
  songName: string;
  releaseDate: string | null;
  albumName: string | null;
  genre: string | null;
  duration: number | null;
  totalListens: number;
  totalLikes: number;
  totalListeningDuration: number;
  averageListeningDuration: number;
  listeners: IndividualUserArtistSongListenerDetail[];
  likers: IndividualUserArtistSongLikeDetail[];
}

interface IndividualUserArtistSongSummary {
  totalSongsReleased: number;
  totalSongLikes: number;
  totalDistinctSongLikers: number;
  totalListeningDuration: number;
  averageListeningDuration: number;
}

interface IndividualUserListenerArtistActivity {
  artistId: number;
  username: string;
  fullName: string;
  country: string | null;
  city: string | null;
  verified: boolean;
  songsLikedCount: number;
  songsListenedCount: number;
  albumsLikedCount: number;
  totalListeningDuration: number;
  followedAt: string | null;
}

interface IndividualUserListenerAlbumActivity {
  albumId: number;
  albumName: string;
  releaseDate: string | null;
  artistUsername: string | null;
  likedAt: string | null;
  songsLikedCount: number;
  totalListeningDuration: number;
}

interface IndividualUserListenerPlaylistSongDetail {
  songId: number;
  songName: string;
  artistUsername: string | null;
  albumName: string | null;
  duration: number | null;
  addedAt: string | null;
}

interface IndividualUserListenerPlaylistLikeDetail {
  userId: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  likedAt: string | null;
}

interface IndividualUserListenerPlaylistActivity {
  playlistId: number;
  playlistName: string;
  isPublic: boolean;
  createdAt: string | null;
  songCount: number;
  totalDuration: number;
  likes: number;
  songs: IndividualUserListenerPlaylistSongDetail[];
  likedBy: IndividualUserListenerPlaylistLikeDetail[];
}

interface IndividualUserArtistAlbumSongDetail {
  songId: number;
  songName: string;
  duration: number | null;
  genre: string | null;
}

interface IndividualUserArtistAlbumActivity {
  albumId: number;
  albumName: string;
  releaseDate: string | null;
  likesCount: number;
  uniqueUserLikes: number;
  totalListeningDuration: number;
  songs: IndividualUserArtistAlbumSongDetail[];
}

export interface IndividualUserDetails {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string | null;
  age: number | null;
  userType: string;
  accountStatus: 'Active' | 'Suspended' | 'Banned';
  statusDate: string | null;
  profilePicture: string | null;
  dateJoined: string | null;
  country: string;
  city: string | null;
  verified?: boolean | null;
  verificationDate?: string | null;
}

export interface IndividualUserSongSummary {
  totalSongsListened: number;
  distinctSongsListened: number;
  songsLiked: number;
  totalListeningDuration: number;
  averageListeningDuration: number;
}

export interface IndividualUserSongListenDetail {
  listenedAt: string | null;
  duration: number;
}

export interface IndividualUserSongActivity {
  songId: number;
  songName: string;
  artistUsername: string | null;
  releaseDate: string | null;
  genre: string | null;
  duration: number | null;
  totalListens: number;
  liked: boolean;
  likedAt: string | null;
  averageListeningDuration: number;
  totalListeningDuration: number;
  listenDetails: IndividualUserSongListenDetail[];
}

// Get user counts by type
export async function getUserCounts(
  pool: Pool,
  filters: AnalyticsFilters
): Promise<UserCount> {
  const { startDate, endDate, includeListeners, includeArtists, includeSuspendedAccounts } = filters;
  const { clause: excludedUsernameClause, params: excludedUsernameParams } = buildExcludedUsernameFilter('Username');
  const accountStatusClause = buildAccountStatusFilter('AccountStatus', includeSuspendedAccounts);
  
  let query = `
    SELECT 
      SUM(CASE WHEN UserType = 'Listener' THEN 1 ELSE 0 END) as listeners,
      SUM(CASE WHEN UserType = 'Artist' THEN 1 ELSE 0 END) as artists
    FROM userprofile
    WHERE UserType IN ('Listener', 'Artist')
      AND UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedUsernameClause}${accountStatusClause}
      AND DateJoined >= ? AND DateJoined <= ?
  `;
  
  const params = [...excludedUsernameParams, startDate, endDate];
  const [rows] = await pool.execute<RowDataPacket[]>(query, params);
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
  
  return { listeners, artists, ...(ratio !== undefined ? { ratio } : {}) };
}

// Get login counts by type
export async function getLoginCounts(
  pool: Pool,
  filters: AnalyticsFilters
): Promise<LoginCount> {
  const { startDate, endDate, includeListeners, includeArtists, includeSuspendedAccounts } = filters;
  const { clause: excludedUsernameClause, params: excludedUsernameParams } = buildExcludedUsernameFilter('up.Username');
  const accountStatusClause = buildAccountStatusFilter('up.AccountStatus', includeSuspendedAccounts);
  
  let query = `
    SELECT 
      SUM(CASE WHEN up.UserType = 'Listener' THEN 1 ELSE 0 END) as listeners,
      SUM(CASE WHEN up.UserType = 'Artist' THEN 1 ELSE 0 END) as artists
    FROM user_logins ul
    JOIN userprofile up ON ul.UserID = up.UserID
    WHERE up.UserType IN ('Listener', 'Artist')
      AND up.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedUsernameClause}${accountStatusClause}
      AND ul.LoginDate >= ? AND ul.LoginDate <= ?
  `;
  
  const params = [...excludedUsernameParams, startDate, endDate];
  const [rows] = await pool.execute<RowDataPacket[]>(query, params);
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
  
  return { listeners, artists, ...(ratio !== undefined ? { ratio } : {}) };
}

// Get total login time
export async function getLoginTime(
  pool: Pool,
  filters: AnalyticsFilters
): Promise<LoginTime> {
  const { startDate, endDate, includeListeners, includeArtists, includeSuspendedAccounts } = filters;
  const { clause: excludedUsernameClause, params: excludedUsernameParams } = buildExcludedUsernameFilter('up.Username');
  const accountStatusClause = buildAccountStatusFilter('up.AccountStatus', includeSuspendedAccounts);
  
  const query = `
    SELECT 
      up.UserType,
      SUM(ul.LoginSession) as totalTime,
      COUNT(DISTINCT ul.UserID) as userCount
    FROM user_logins ul
    JOIN userprofile up ON ul.UserID = up.UserID
    WHERE up.UserType IN ('Listener', 'Artist')
      AND up.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedUsernameClause}${accountStatusClause}
      AND ul.LoginDate >= ? AND ul.LoginDate <= ?
      AND ul.LogoutDate IS NOT NULL
      AND ul.LoginSession IS NOT NULL
    GROUP BY up.UserType
  `;
  
  const params = [...excludedUsernameParams, startDate, endDate];
  const [rows] = await pool.execute<RowDataPacket[]>(query, params);
  
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
  const { startDate, endDate, includeSuspendedAccounts } = filters;
  const { clause: excludedUsernameClause, params: excludedUsernameParams } = buildExcludedUsernameFilter('listener.Username');
  const accountStatusClause = buildAccountStatusFilter('listener.AccountStatus', includeSuspendedAccounts);
  
  const query = `
    SELECT COUNT(*) as total
    FROM listening_history history
    JOIN userprofile listener ON history.UserID = listener.UserID
    WHERE listener.UserType = 'Listener'
      AND listener.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedUsernameClause}${accountStatusClause}
      AND history.ListenedAt >= ? AND history.ListenedAt <= ?
  `;
  
  const params = [...excludedUsernameParams, startDate, endDate];
  const [rows] = await pool.execute<RowDataPacket[]>(query, params);
  return rows[0]?.total ? Number(rows[0].total) : 0;
}

// Get songs uploaded count
export async function getSongsUploaded(
  pool: Pool,
  filters: AnalyticsFilters
): Promise<number> {
  const { startDate, endDate, includeSuspendedAccounts } = filters;
  const { clause: excludedUsernameClause, params: excludedUsernameParams } = buildExcludedUsernameFilter('up.Username');
  const accountStatusClause = buildAccountStatusFilter('up.AccountStatus', includeSuspendedAccounts);
  
  const query = `
    SELECT COUNT(*) as total
    FROM song s
    JOIN userprofile up ON s.ArtistID = up.UserID
    WHERE up.UserType = 'Artist'
      AND up.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedUsernameClause}${accountStatusClause}
      AND s.ReleaseDate >= ? AND s.ReleaseDate <= ?
  `;
  
  const params = [...excludedUsernameParams, startDate, endDate];
  const [rows] = await pool.execute<RowDataPacket[]>(query, params);
  return rows[0]?.total ? Number(rows[0].total) : 0;
}

export async function getSongActivity(
  pool: Pool,
  filters: AnalyticsFilters
): Promise<SongActivity[]> {
  if (filters.showSongStats === false) {
    return [];
  }

  const { startDate, endDate } = filters;
  const excludedListener = buildExcludedUsernameFilter('listener.Username');
  const excludedLiker = buildExcludedUsernameFilter('liker.Username');
  const listenerStatusClause = buildAccountStatusFilter('listener.AccountStatus', filters.includeSuspendedAccounts);
  const likerStatusClause = buildAccountStatusFilter('liker.AccountStatus', filters.includeSuspendedAccounts);

  const songRowsQuery = `
    SELECT
      song.SongID,
      song.SongName,
      artist.Username AS ArtistName,
      song.ReleaseDate,
      song.Duration,
      genre.GenreName,
      COUNT(*) AS totalListens
    FROM listening_history history
    JOIN userprofile listener ON history.UserID = listener.UserID
    JOIN song ON history.SongID = song.SongID
    LEFT JOIN userprofile artist ON song.ArtistID = artist.UserID
    LEFT JOIN genre ON song.GenreID = genre.GenreID
    WHERE listener.UserType IN ('Listener', 'Artist')
      AND listener.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedListener.clause}${listenerStatusClause}
      AND history.ListenedAt >= ? AND history.ListenedAt <= ?
    GROUP BY song.SongID, song.SongName, artist.Username, song.ReleaseDate, song.Duration, genre.GenreName
    ORDER BY totalListens DESC, song.SongName ASC
  `;

  const songParams = [...excludedListener.params, startDate, endDate];
  const [songRows] = await pool.execute<RowDataPacket[]>(songRowsQuery, songParams);

  if (!songRows || songRows.length === 0) {
    return [];
  }

  const songIds = songRows.map((row) => Number(row.SongID));
  const songIdPlaceholders = songIds.map(() => '?').join(', ');

  const listenerQuery = `
    SELECT
      history.SongID,
      listener.UserID,
      listener.Username,
      listener.Email,
      listener.Country,
      COUNT(*) AS listenCount,
      SUM(COALESCE(history.Duration, 0)) AS totalDuration,
      AVG(COALESCE(history.Duration, 0)) AS averageDuration
    FROM listening_history history
    JOIN userprofile listener ON history.UserID = listener.UserID
    WHERE listener.UserType IN ('Listener', 'Artist')
      AND listener.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedListener.clause}${listenerStatusClause}
      AND history.ListenedAt >= ? AND history.ListenedAt <= ?
      AND history.SongID IN (${songIdPlaceholders})
    GROUP BY history.SongID, listener.UserID, listener.Username, listener.Email, listener.Country
  `;

  const listenerParams = [...excludedListener.params, startDate, endDate, ...songIds];
  const [listenerRows] = await pool.execute<RowDataPacket[]>(listenerQuery, listenerParams);

  const likesQuery = `
    SELECT
      likes.SongID,
      likes.UserID,
      likes.LikedAt
    FROM user_likes_song likes
    JOIN userprofile liker ON likes.UserID = liker.UserID
    WHERE liker.UserType IN ('Listener', 'Artist')
      AND liker.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedLiker.clause}${likerStatusClause}
      AND likes.SongID IN (${songIdPlaceholders})
      AND likes.LikedAt >= ? AND likes.LikedAt <= ?
  `;

  const likesParams = [...excludedLiker.params, ...songIds, startDate, endDate];
  const [likesRows] = await pool.execute<RowDataPacket[]>(likesQuery, likesParams);

  const likesMap = new Map<number, Map<number, string | null>>();
  for (const row of likesRows as any[]) {
    const songId = Number(row.SongID);
    const userId = Number(row.UserID);
    const likedAt = row.LikedAt ? new Date(row.LikedAt).toISOString() : null;
    if (!likesMap.has(songId)) {
      likesMap.set(songId, new Map<number, string | null>());
    }
    likesMap.get(songId)!.set(userId, likedAt);
  }

  const songListenerMap = new Map<number, SongListenerDetail[]>();
  for (const row of listenerRows as any[]) {
    const songId = Number(row.SongID);
    const listeners = songListenerMap.get(songId) ?? [];
    const userId = Number(row.UserID);
    const likedAt = likesMap.get(songId)?.get(userId) ?? null;
    listeners.push({
      userId,
      username: row.Username || 'Unknown',
      email: row.Email || '',
      country: row.Country ? String(row.Country).trim() || null : null,
      listenCount: Number(row.listenCount || 0),
      totalDuration: Number(row.totalDuration || 0),
      averageDuration: Number(row.averageDuration || 0),
      liked: likedAt !== null,
      likedAt
    });
    songListenerMap.set(songId, listeners);
  }

  const activities: SongActivity[] = [];
  for (const row of songRows as any[]) {
    const songId = Number(row.SongID);
    const listeners = songListenerMap.get(songId) ?? [];
    listeners.sort((a, b) => b.listenCount - a.listenCount || a.username.localeCompare(b.username));

    const totalLikes = likesMap.get(songId)?.size ?? 0;
    const totalListeningTime = listeners.reduce((sum, listener) => sum + listener.totalDuration, 0);
    const totalListenEvents = listeners.reduce((sum, listener) => sum + listener.listenCount, 0);
    const rawAverage = totalListenEvents > 0 ? totalListeningTime / totalListenEvents : 0;
    const maxDuration = row.Duration != null && Number(row.Duration) > 0 ? Number(row.Duration) : FALLBACK_SONG_DURATION;
    const clampedAverage = Math.min(rawAverage, maxDuration);
    const averageListeningTime = Math.round(clampedAverage);

    activities.push({
      songId,
      songName: row.SongName || 'Unknown Song',
      artistName: row.ArtistName || 'Unknown Artist',
      releaseDate: row.ReleaseDate ? new Date(row.ReleaseDate).toISOString() : null,
      genre: row.GenreName || null,
      duration: row.Duration != null ? Number(row.Duration) : null,
      totalListens: Number(row.totalListens || 0),
      totalLikes,
      totalListeningTime,
      averageListeningTime,
      listenerDetails: listeners
    });
  }

  return activities;
}

export async function getArtistActivity(
  pool: Pool,
  filters: AnalyticsFilters
): Promise<{ artists: ArtistActivity[]; albums: AlbumActivity[] }> {
  if (filters.showArtistStats === false || !filters.includeArtists) {
    return { artists: [], albums: [] };
  }

  const { startDate, endDate, includeSuspendedAccounts } = filters;
  const { clause: excludedUsernameClause, params: excludedUsernameParams } = buildExcludedUsernameFilter('up.Username');
  const accountStatusClause = buildAccountStatusFilter('up.AccountStatus', includeSuspendedAccounts);

  const baseQuery = `
    SELECT
      up.UserID as artistId,
      up.Username,
      up.FirstName,
      up.LastName,
      TIMESTAMPDIFF(YEAR, up.DateOfBirth, CURDATE()) as Age,
      up.ProfilePicture,
      up.DateJoined,
      up.Country,
      up.City,
      a.VerifiedStatus,
      a.DateVerified
    FROM userprofile up
    JOIN artist a ON a.ArtistID = up.UserID
    WHERE up.UserType = 'Artist'
      AND up.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedUsernameClause}${accountStatusClause}
      AND up.DateJoined >= ? AND up.DateJoined <= ?
    ORDER BY up.Username DESC
  `;

  const baseParams = [...excludedUsernameParams, startDate, endDate];
  const [artistRows] = await pool.execute<RowDataPacket[]>(baseQuery, baseParams);
  if (!artistRows || artistRows.length === 0) {
    return { artists: [], albums: [] };
  }

  const { clause: excludedListenerClause, params: excludedListenerParams } = buildExcludedUsernameFilter('listener.Username');
  const listenerStatusClause = buildAccountStatusFilter('listener.AccountStatus', includeSuspendedAccounts);
  const { clause: excludedLikerClause, params: excludedLikerParams } = buildExcludedUsernameFilter('liker.Username');
  const likerStatusClause = buildAccountStatusFilter('liker.AccountStatus', includeSuspendedAccounts);
  const { clause: excludedFollowerClause, params: excludedFollowerParams } = buildExcludedUsernameFilter('follower.Username');
  const followerStatusClause = buildAccountStatusFilter('follower.AccountStatus', includeSuspendedAccounts);

  const activities: ArtistActivity[] = [];
  const albumActivities: AlbumActivity[] = [];

  for (const row of artistRows as any[]) {
    const artistId = Number(row.artistId ?? row.ArtistID ?? row.UserID);
    const artistUsername = row.Username ? String(row.Username) : '';
    const artistFirstName = row.FirstName ? String(row.FirstName) : '';
    const artistLastName = row.LastName ? String(row.LastName) : '';
    const artistFullName = [artistFirstName, artistLastName].filter(Boolean).join(' ').trim();

    const statsQuery = `
      SELECT
        (SELECT COUNT(*)
         FROM song s
         WHERE s.ArtistID = ?
           AND s.ReleaseDate >= ? AND s.ReleaseDate <= ?) as songsReleased,
        (SELECT COUNT(*)
         FROM album alb
         WHERE alb.ArtistID = ?
           AND alb.ReleaseDate >= ? AND alb.ReleaseDate <= ?) as albumsReleased,
        (SELECT COUNT(*)
         FROM listening_history lh
         JOIN song s ON lh.SongID = s.SongID
         JOIN userprofile listener ON listener.UserID = lh.UserID
         WHERE s.ArtistID = ?
           AND lh.ListenedAt >= ? AND lh.ListenedAt <= ?
           AND listener.UserID <> ?
           AND listener.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedListenerClause}${listenerStatusClause}
        ) as totalListens,
        (SELECT COALESCE(SUM(lh.Duration), 0)
         FROM listening_history lh
         JOIN song s ON lh.SongID = s.SongID
         JOIN userprofile listener ON listener.UserID = lh.UserID
         WHERE s.ArtistID = ?
           AND lh.ListenedAt >= ? AND lh.ListenedAt <= ?
           AND listener.UserID <> ?
           AND listener.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedListenerClause}${listenerStatusClause}
        ) as totalListeningDuration,
        (SELECT COUNT(*)
         FROM user_likes_song uls
         JOIN song s ON uls.SongID = s.SongID
         JOIN userprofile liker ON liker.UserID = uls.UserID
         WHERE s.ArtistID = ?
           AND uls.LikedAt >= ? AND uls.LikedAt <= ?
           AND liker.UserID <> ?
           AND liker.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedLikerClause}${likerStatusClause}
        ) as totalSongLikes,
        (SELECT COUNT(*)
         FROM user_likes_album ula
         JOIN album alb ON ula.AlbumID = alb.AlbumID
         JOIN userprofile liker ON liker.UserID = ula.UserID
         WHERE alb.ArtistID = ?
           AND ula.LikedAt >= ? AND ula.LikedAt <= ?
           AND liker.UserID <> ?
           AND liker.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedLikerClause}${likerStatusClause}
        ) as totalAlbumLikes
    `;

    const statsParams = [
      artistId, startDate, endDate, // songsReleased
      artistId, startDate, endDate, // albumsReleased
      artistId, startDate, endDate, artistId, ...excludedListenerParams, // totalListens
      artistId, startDate, endDate, artistId, ...excludedListenerParams, // totalListeningDuration
      artistId, startDate, endDate, artistId, ...excludedLikerParams, // totalSongLikes
      artistId, startDate, endDate, artistId, ...excludedLikerParams // totalAlbumLikes
    ];

    const [statsRows] = await pool.execute<RowDataPacket[]>(statsQuery, statsParams);
    const stats = (statsRows?.[0] as {
      songsReleased?: number;
      albumsReleased?: number;
      totalListens?: number;
      totalListeningDuration?: number;
      totalSongLikes?: number;
      totalAlbumLikes?: number;
    }) ?? {};

    const genresQuery = `
      SELECT
        COALESCE(g.GenreName, 'Unknown') as GenreName,
        COUNT(*) as GenreCount
      FROM song s
      LEFT JOIN genre g ON s.GenreID = g.GenreID
      WHERE s.ArtistID = ?
        AND s.ReleaseDate >= ? AND s.ReleaseDate <= ?
      GROUP BY COALESCE(g.GenreName, 'Unknown')
      ORDER BY GenreCount DESC, GenreName ASC
    `;
    const [genreRows] = await pool.execute<RowDataPacket[]>(genresQuery, [artistId, startDate, endDate]);
    const genres = genreRows.map((genreRow: any) => genreRow.GenreName || 'Unknown');

    const albumQuery = `
      SELECT
        alb.AlbumID,
        alb.AlbumName,
        alb.ReleaseDate
      FROM album alb
      WHERE alb.ArtistID = ?
        AND alb.ReleaseDate >= ? AND alb.ReleaseDate <= ?
      ORDER BY alb.ReleaseDate DESC, alb.AlbumName ASC
    `;
    const [albumRows] = await pool.execute<RowDataPacket[]>(albumQuery, [artistId, startDate, endDate]);

    if (albumRows.length > 0) {
      const albumIds = albumRows.map((albumRow: any) => Number(albumRow.AlbumID));
      const placeholders = albumIds.map(() => '?').join(', ');

      const songQuery = `
        SELECT
          s.AlbumID,
          s.SongID,
          s.SongName,
          s.Duration,
          g.GenreName
        FROM song s
        LEFT JOIN genre g ON s.GenreID = g.GenreID
        WHERE s.AlbumID IN (${placeholders})
          AND s.ReleaseDate >= ? AND s.ReleaseDate <= ?
        ORDER BY s.ReleaseDate ASC, s.SongName ASC
      `;
      const songParams = [...albumIds, startDate, endDate];
      const [albumSongRows] = await pool.execute<RowDataPacket[]>(songQuery, songParams);

      const likesQuery = `
        SELECT
          ula.AlbumID,
          COUNT(*) as likes
        FROM user_likes_album ula
        JOIN userprofile liker ON liker.UserID = ula.UserID
        WHERE ula.AlbumID IN (${placeholders})
          AND ula.LikedAt >= ? AND ula.LikedAt <= ?
          AND liker.UserID <> ?
          AND liker.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedLikerClause}${likerStatusClause}
        GROUP BY ula.AlbumID
      `;
      const likesParams = [...albumIds, startDate, endDate, artistId, ...excludedLikerParams];
      const [albumLikesRows] = await pool.execute<RowDataPacket[]>(likesQuery, likesParams);

      const listensQuery = `
        SELECT
          s.AlbumID,
          COUNT(*) as totalListens
        FROM listening_history lh
        JOIN song s ON lh.SongID = s.SongID
        JOIN userprofile listener ON listener.UserID = lh.UserID
        WHERE s.AlbumID IN (${placeholders})
          AND lh.ListenedAt >= ? AND lh.ListenedAt <= ?
          AND listener.UserID <> ?
          AND listener.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedListenerClause}${listenerStatusClause}
        GROUP BY s.AlbumID
      `;
      const listensParams = [...albumIds, startDate, endDate, artistId, ...excludedListenerParams];
      const [albumListenRows] = await pool.execute<RowDataPacket[]>(listensQuery, listensParams);

      const likedUsersQuery = `
        SELECT
          ula.AlbumID,
          liker.UserID,
          liker.Username,
          liker.FirstName,
          liker.LastName,
          liker.Email,
          ula.LikedAt
        FROM user_likes_album ula
        JOIN userprofile liker ON liker.UserID = ula.UserID
        WHERE ula.AlbumID IN (${placeholders})
          AND ula.LikedAt >= ? AND ula.LikedAt <= ?
          AND liker.UserID <> ?
          AND liker.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedLikerClause}${likerStatusClause}
        ORDER BY ula.LikedAt DESC
      `;
      const likedUsersParams = [...albumIds, startDate, endDate, artistId, ...excludedLikerParams];
      const [likedUserRows] = await pool.execute<RowDataPacket[]>(likedUsersQuery, likedUsersParams);

      const likesMap = new Map<number, number>();
      for (const likeRow of albumLikesRows as any[]) {
        likesMap.set(Number(likeRow.AlbumID), Number(likeRow.likes || 0));
      }

      const listensMap = new Map<number, number>();
      for (const listenRow of albumListenRows as any[]) {
        listensMap.set(Number(listenRow.AlbumID), Number(listenRow.totalListens || 0));
      }

      const songsMap = new Map<number, ArtistAlbumSongDetail[]>();
      const albumGenreMap = new Map<number, Map<string, number>>();
      const likedUsersMap = new Map<number, AlbumLikeDetail[]>();

      for (const songRow of albumSongRows as any[]) {
        const albumId = Number(songRow.AlbumID);
        const duration = songRow.Duration != null ? Number(songRow.Duration) : null;
        const songDetail: ArtistAlbumSongDetail = {
          songId: Number(songRow.SongID),
          songName: songRow.SongName || 'Unknown Song',
          duration,
          genre: songRow.GenreName || null
        };
        const existingSongs = songsMap.get(albumId) ?? [];
        existingSongs.push(songDetail);
        songsMap.set(albumId, existingSongs);

        const genreName = songRow.GenreName || 'Unknown';
        const genreCounts = albumGenreMap.get(albumId) ?? new Map<string, number>();
        genreCounts.set(genreName, (genreCounts.get(genreName) || 0) + 1);
        albumGenreMap.set(albumId, genreCounts);
      }

      for (const likedRow of likedUserRows as any[]) {
        const albumId = Number(likedRow.AlbumID);
        const likedList = likedUsersMap.get(albumId) ?? [];
        likedList.push({
          userId: Number(likedRow.UserID),
          username: likedRow.Username ? String(likedRow.Username) : '',
          firstName: likedRow.FirstName ? String(likedRow.FirstName) : '',
          lastName: likedRow.LastName ? String(likedRow.LastName) : '',
          email: likedRow.Email ? String(likedRow.Email) : '',
          likedAt: likedRow.LikedAt ? new Date(likedRow.LikedAt).toISOString() : null
        });
        likedUsersMap.set(albumId, likedList);
      }

      for (const albumRow of albumRows as any[]) {
        const albumId = Number(albumRow.AlbumID);
        const albumSongs = songsMap.get(albumId) ?? [];
        const totalDuration = albumSongs.reduce((sum, song) => sum + (song.duration ?? 0), 0);
        const genreCounts = albumGenreMap.get(albumId);
        let albumGenre: string | null = null;
        if (genreCounts && genreCounts.size > 0) {
          const sortedGenres = Array.from(genreCounts.entries()).sort((a, b) => {
            if (b[1] !== a[1]) {
              return b[1] - a[1];
            }
            return a[0].localeCompare(b[0]);
          });
          albumGenre = sortedGenres[0]?.[0] ?? null;
        }

        albumActivities.push({
          albumId,
          albumName: albumRow.AlbumName || 'Untitled Album',
          artistId,
          artistUsername,
          artistName: artistUsername || artistFullName || 'Unknown Artist',
          releaseDate: albumRow.ReleaseDate ? new Date(albumRow.ReleaseDate).toISOString() : null,
          totalDuration,
          songCount: albumSongs.length,
          genre: albumGenre,
          likes: likesMap.get(albumId) || 0,
          listens: listensMap.get(albumId) || 0,
          songs: albumSongs,
          likedBy: likedUsersMap.get(albumId) ?? []
        });
      }
    }

    const verifiedStatus = row.VerifiedStatus != null ? Number(row.VerifiedStatus) : 0;

    const followersQuery = `
      SELECT
        follower.UserID,
        follower.Username,
        follower.Email,
        ufa.FollowedAt
      FROM user_follows_artist ufa
      JOIN userprofile follower ON follower.UserID = ufa.UserID
      WHERE ufa.ArtistID = ?
        AND ufa.FollowedAt >= ? AND ufa.FollowedAt <= ?
        AND follower.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedFollowerClause}${followerStatusClause}
      ORDER BY ufa.FollowedAt DESC
    `;
    const [followersRows] = await pool.execute<RowDataPacket[]>(followersQuery, [
      artistId,
      startDate,
      endDate,
      ...excludedFollowerParams
    ]);

    const followers: ArtistFollowerDetail[] = followersRows.map((row: any) => ({
      userId: Number(row.UserID),
      username: row.Username || 'Unknown',
      email: row.Email || '',
      followedAt: row.FollowedAt ? new Date(row.FollowedAt).toISOString() : null
    }));

    const activity: ArtistActivity = {
      artistId,
      username: artistUsername,
      firstName: artistFirstName,
      lastName: artistLastName,
      age: typeof row.Age === 'number' ? row.Age : row.Age != null ? Number(row.Age) : null,
      profilePicture: row.ProfilePicture ? String(row.ProfilePicture) : null,
      verified: verifiedStatus === 1,
      dateVerified: row.DateVerified ? new Date(row.DateVerified).toISOString() : null,
      dateJoined: row.DateJoined ? new Date(row.DateJoined).toISOString() : '',
      country: row.Country ? String(row.Country) : null,
      city: normalizeCity(row.City),
      songsReleased: Number(stats.songsReleased || 0),
      albumsReleased: Number(stats.albumsReleased || 0),
      totalListens: Number(stats.totalListens || 0),
      totalListeningDuration: Number(stats.totalListeningDuration || 0),
      totalSongLikes: Number(stats.totalSongLikes || 0),
      totalAlbumLikes: Number(stats.totalAlbumLikes || 0),
      genres,
      followers
    };

    activities.push(activity);
  }

  return { artists: activities, albums: albumActivities };
}

export async function getPlaylistActivity(
  pool: Pool,
  filters: AnalyticsFilters
): Promise<PlaylistActivityResult> {
  if (!filters.includePlaylistStatistics) {
    return { publicPlaylists: [], privatePlaylists: [] };
  }

  const { startDate, endDate, includeSuspendedAccounts } = filters;
  const { clause: excludedOwnerClause, params: excludedOwnerParams } = buildExcludedUsernameFilter('owner.Username');
  const ownerStatusClause = buildAccountStatusFilter('owner.AccountStatus', includeSuspendedAccounts);

  const playlistQuery = `
    SELECT DISTINCT
      p.PlaylistID,
      p.PlaylistName,
      p.IsPublic,
      p.CreatedAt as PlaylistCreatedAt,
      owner.Username as OwnerUsername
    FROM playlist p
    JOIN userprofile owner ON owner.UserID = p.UserID
    WHERE owner.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedOwnerClause}${ownerStatusClause}
      AND (
        p.CreatedAt >= ? AND p.CreatedAt <= ?
        OR EXISTS (
          SELECT 1
          FROM playlist_song ps
          WHERE ps.PlaylistID = p.PlaylistID
            AND ps.AddedAt >= ? AND ps.AddedAt <= ?
        )
        OR (p.IsPublic = 1 AND EXISTS (
          SELECT 1
          FROM user_likes_playlist ulp
          WHERE ulp.PlaylistID = p.PlaylistID
            AND ulp.LikedAt >= ? AND ulp.LikedAt <= ?
        ))
      )
    ORDER BY p.IsPublic DESC, p.PlaylistName ASC
  `;

  const playlistParams = [
    ...excludedOwnerParams,
    startDate,
    endDate,
    startDate,
    endDate,
    startDate,
    endDate
  ];
  const [playlistRows] = await pool.execute<RowDataPacket[]>(playlistQuery, playlistParams);

  if (!playlistRows || playlistRows.length === 0) {
    return { publicPlaylists: [], privatePlaylists: [] };
  }

  const playlistIds = playlistRows.map((row: any) => Number(row.PlaylistID));
  const playlistPlaceholders = playlistIds.map(() => '?').join(', ');

  const songsQuery = `
    SELECT
      ps.PlaylistID,
      s.SongID,
      s.SongName,
      COALESCE(artist.Username, 'Unknown Artist') as ArtistName,
      alb.AlbumName,
      ps.AddedAt,
      s.Duration
    FROM playlist_song ps
    JOIN song s ON ps.SongID = s.SongID
    LEFT JOIN userprofile artist ON s.ArtistID = artist.UserID
    LEFT JOIN album alb ON s.AlbumID = alb.AlbumID
    WHERE ps.PlaylistID IN (${playlistPlaceholders})
      AND ps.AddedAt >= ? AND ps.AddedAt <= ?
    ORDER BY ps.AddedAt DESC, s.SongName ASC
  `;
  const songsParams = [...playlistIds, startDate, endDate];
  const [songRows] = await pool.execute<RowDataPacket[]>(songsQuery, songsParams);

  const publicPlaylistIds = playlistRows
    .filter((row: any) => Number(row.IsPublic) === 1)
    .map((row: any) => Number(row.PlaylistID));

  let likesRows: RowDataPacket[] = [];
  if (publicPlaylistIds.length > 0) {
    const publicPlaceholders = publicPlaylistIds.map(() => '?').join(', ');
    const { clause: excludedLikerClause, params: excludedLikerParams } = buildExcludedUsernameFilter('liker.Username');
    const likerStatusClause = buildAccountStatusFilter('liker.AccountStatus', includeSuspendedAccounts);

    const likesQuery = `
      SELECT
        ulp.PlaylistID,
        liker.UserID,
        liker.Username,
        ulp.LikedAt
      FROM user_likes_playlist ulp
      JOIN userprofile liker ON liker.UserID = ulp.UserID
      WHERE ulp.PlaylistID IN (${publicPlaceholders})
        AND ulp.LikedAt >= ? AND ulp.LikedAt <= ?
        AND liker.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedLikerClause}${likerStatusClause}
      ORDER BY ulp.LikedAt DESC
    `;
    const likesParams = [...publicPlaylistIds, startDate, endDate, ...excludedLikerParams];
    const [likesResult] = await pool.execute<RowDataPacket[]>(likesQuery, likesParams);
    likesRows = likesResult;
  }

  const songMap = new Map<number, PlaylistSongDetail[]>();
  const durationMap = new Map<number, number>();

  for (const row of songRows as any[]) {
    const playlistId = Number(row.PlaylistID);
    const songs = songMap.get(playlistId) ?? [];
    const duration = row.Duration != null ? Number(row.Duration) : null;
    if (duration != null) {
      durationMap.set(playlistId, (durationMap.get(playlistId) ?? 0) + duration);
    }
    songs.push({
      songId: Number(row.SongID),
      songName: row.SongName || 'Unknown Song',
      artistName: row.ArtistName || 'Unknown Artist',
      albumName: row.AlbumName || null,
      addedAt: row.AddedAt ? new Date(row.AddedAt).toISOString() : null,
      duration
    });
    songMap.set(playlistId, songs);
  }

  const likesCountMap = new Map<number, number>();
  const likedUsersMap = new Map<number, PlaylistLikeDetail[]>();
  for (const row of likesRows as any[]) {
    const playlistId = Number(row.PlaylistID);
    likesCountMap.set(playlistId, (likesCountMap.get(playlistId) ?? 0) + 1);
    const likedUsers = likedUsersMap.get(playlistId) ?? [];
    likedUsers.push({
      userId: Number(row.UserID),
      username: row.Username || 'Unknown',
      likedAt: row.LikedAt ? new Date(row.LikedAt).toISOString() : null
    });
    likedUsersMap.set(playlistId, likedUsers);
  }

  const result: PlaylistActivityResult = {
    publicPlaylists: [],
    privatePlaylists: []
  };

  for (const row of playlistRows as any[]) {
    const playlistId = Number(row.PlaylistID);
    const isPublic = Number(row.IsPublic) === 1;
    const songs = songMap.get(playlistId) ?? [];
    const totalDuration = durationMap.get(playlistId) ?? 0;
    const likes = isPublic ? likesCountMap.get(playlistId) ?? 0 : 0;
    const likedBy = isPublic ? likedUsersMap.get(playlistId) ?? [] : [];

    const activity: PlaylistActivity = {
      playlistId,
      playlistName: row.PlaylistName || 'Untitled Playlist',
      isPublic,
      ownerUsername: row.OwnerUsername || 'Unknown',
      createdAt: row.PlaylistCreatedAt ? new Date(row.PlaylistCreatedAt).toISOString() : null,
      songCount: songs.length,
      totalDuration,
      likes,
      songs,
      likedBy
    };

    if (isPublic) {
      result.publicPlaylists.push(activity);
    } else {
      result.privatePlaylists.push(activity);
    }
  }

  return result;
}

export async function getUsersByType(
  pool: Pool,
  filters: AnalyticsFilters,
  userType: 'Listener' | 'Artist'
): Promise<UserSummary[]> {
  const { startDate, endDate, includeSuspendedAccounts } = filters;
  const { clause: excludedUsernameClause, params: excludedUsernameParams } = buildExcludedUsernameFilter('up.Username');
  const accountStatusClause = buildAccountStatusFilter('up.AccountStatus', includeSuspendedAccounts);

  const query = `
    SELECT 
      up.Username,
      up.FirstName,
      up.LastName,
      up.DateOfBirth,
      TIMESTAMPDIFF(YEAR, up.DateOfBirth, CURDATE()) as Age,
      up.Email,
      up.DateJoined,
      up.Country,
      up.City,
      COUNT(ul.LoginID) as TotalLogins,
      SUM(ul.LoginSession) as TotalLoginTime,
      AVG(ul.LoginSession) as AverageLoginTime,
      (
        SELECT COUNT(*)
        FROM listening_history lh
        WHERE lh.UserID = up.UserID
          AND lh.ListenedAt >= ? AND lh.ListenedAt <= ?
      ) as TotalSongsPlayed,
      (
        SELECT COUNT(DISTINCT lh.SongID)
        FROM listening_history lh
        WHERE lh.UserID = up.UserID
          AND lh.ListenedAt >= ? AND lh.ListenedAt <= ?
      ) as DistinctSongsPlayed,
      (
        SELECT COUNT(*)
        FROM user_likes_song uls
        WHERE uls.UserID = up.UserID
          AND uls.LikedAt >= ? AND uls.LikedAt <= ?
      ) as SongsLiked,
      (
        SELECT COUNT(*)
        FROM user_follows_artist ufa
        WHERE ufa.UserID = up.UserID
          AND ufa.FollowedAt >= ? AND ufa.FollowedAt <= ?
      ) as ArtistsFollowed,
      (
        SELECT COUNT(*)
        FROM playlist p
        WHERE p.UserID = up.UserID
          AND p.CreatedAt >= ? AND p.CreatedAt <= ?
      ) as PlaylistsCreated,
      (
        SELECT COUNT(*)
        FROM user_likes_album ula
        WHERE ula.UserID = up.UserID
          AND ula.LikedAt >= ? AND ula.LikedAt <= ?
      ) as AlbumsLiked,
      (
        SELECT COUNT(*)
        FROM song s
        WHERE s.ArtistID = up.UserID
          AND s.ReleaseDate >= ? AND s.ReleaseDate <= ?
      ) as SongsReleased,
      (
        SELECT COUNT(*)
        FROM album a
        WHERE a.ArtistID = up.UserID
          AND a.CreatedAt >= ? AND a.CreatedAt <= ?
      ) as AlbumsReleased
    FROM userprofile up
    LEFT JOIN user_logins ul
      ON ul.UserID = up.UserID
      AND ul.LoginDate >= ? AND ul.LoginDate <= ?
    WHERE up.UserType = ?
      AND up.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedUsernameClause}${accountStatusClause}
      AND up.DateJoined >= ? AND up.DateJoined <= ?
    GROUP BY 
      up.Username,
      up.FirstName,
      up.LastName,
      up.DateOfBirth,
      Age,
      up.Email,
      up.DateJoined,
      up.Country,
      up.City
    ORDER BY up.DateJoined DESC, up.Username ASC
  `;

  const params = [
    startDate, endDate,
    startDate, endDate,
    startDate, endDate,
    startDate, endDate,
    startDate, endDate,
    startDate, endDate,
    startDate, endDate,
    startDate, endDate,
    startDate, endDate,
    userType,
    ...excludedUsernameParams,
    startDate, endDate
  ];

  const [rows] = await pool.execute<RowDataPacket[]>(query, params);
  const summaries = rows.map(mapUserSummary);

  for (const summary of summaries) {
    let activityScore =
      summary.totalLogins +
      summary.totalLoginTime +
      summary.averageLoginTime +
      summary.totalSongsPlayed +
      summary.distinctSongsPlayed +
      summary.songsLiked +
      summary.artistsFollowed +
      summary.playlistsCreated +
      summary.albumsLiked;

    if (userType === 'Artist') {
      activityScore += summary.songsReleased + summary.albumsReleased;
    }

    summary.activityScore = activityScore;
  }

  summaries.sort((a, b) => {
    if (b.activityScore !== a.activityScore) {
      return b.activityScore - a.activityScore;
    }
    return a.username.localeCompare(b.username);
  });

  return summaries;
}

// Get playlist statistics
export async function getPlaylistStats(
  pool: Pool,
  filters: AnalyticsFilters
): Promise<PlaylistStats> {
  const { startDate, endDate, includeSuspendedAccounts } = filters;
  const { clause: excludedUsernameClause, params: excludedUsernameParams } = buildExcludedUsernameFilter('up.Username');
  const accountStatusClause = buildAccountStatusFilter('up.AccountStatus', includeSuspendedAccounts);
  
  // Total created, private, public (excluding Analyst users)
  const createdQuery = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN p.IsPublic = 0 THEN 1 ELSE 0 END) as private,
      SUM(CASE WHEN p.IsPublic = 1 THEN 1 ELSE 0 END) as public
    FROM playlist p
    JOIN userprofile up ON p.UserID = up.UserID
    WHERE up.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedUsernameClause}${accountStatusClause}
      AND p.CreatedAt >= ? AND p.CreatedAt <= ?
  `;
  
  const createdParams = [...excludedUsernameParams, startDate, endDate];
  const [createdRows] = await pool.execute<RowDataPacket[]>(createdQuery, createdParams);
  const created = createdRows[0] as { total: number; private: number; public: number };
  
  // Total liked and distinct liked (excluding Analyst users)
  const likedQuery = `
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT ulp.PlaylistID) as distinct_count
    FROM user_likes_playlist ulp
    JOIN userprofile up ON ulp.UserID = up.UserID
    WHERE up.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedUsernameClause}${accountStatusClause}
      AND ulp.LikedAt >= ? AND ulp.LikedAt <= ?
  `;
  
  const likedParams = [...excludedUsernameParams, startDate, endDate];
  const [likedRows] = await pool.execute<RowDataPacket[]>(likedQuery, likedParams);
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
  const { startDate, endDate, includeSuspendedAccounts } = filters;
  const { clause: excludedUsernameClause, params: excludedUsernameParams } = buildExcludedUsernameFilter('up.Username');
  const accountStatusClause = buildAccountStatusFilter('up.AccountStatus', includeSuspendedAccounts);
  
  // Total liked and distinct liked (excluding Analyst users)
  const likedQuery = `
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT ula.AlbumID) as distinct_count
    FROM user_likes_album ula
    JOIN userprofile up ON ula.UserID = up.UserID
    WHERE up.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedUsernameClause}${accountStatusClause}
      AND ula.LikedAt >= ? AND ula.LikedAt <= ?
  `;
  
  const likedParams = [...excludedUsernameParams, startDate, endDate];
  const [likedRows] = await pool.execute<RowDataPacket[]>(likedQuery, likedParams);
  const liked = likedRows[0] as { total: number; distinct_count: number };
  
  // Total created (excluding Analyst users)
  const createdQuery = `
    SELECT COUNT(*) as total
    FROM album a
    JOIN artist ar ON a.ArtistID = ar.ArtistID
    JOIN userprofile up ON ar.ArtistID = up.UserID
    WHERE up.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedUsernameClause}${accountStatusClause}
      AND a.CreatedAt >= ? AND a.CreatedAt <= ?
  `;
  
  const createdParams = [...excludedUsernameParams, startDate, endDate];
  const [createdRows] = await pool.execute<RowDataPacket[]>(createdQuery, createdParams);
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
  const { startDate, endDate, includeSuspendedAccounts } = filters;
  const { clause: excludedUsernameClause, params: excludedUsernameParams } = buildExcludedUsernameFilter('up.Username');
  const accountStatusClause = buildAccountStatusFilter('up.AccountStatus', includeSuspendedAccounts);
  
  const query = `
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT uls.SongID) as distinct_count
    FROM user_likes_song uls
    JOIN userprofile up ON uls.UserID = up.UserID
    WHERE up.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedUsernameClause}${accountStatusClause}
      AND uls.LikedAt >= ? AND uls.LikedAt <= ?
  `;
  
  const params = [...excludedUsernameParams, startDate, endDate];
  const [rows] = await pool.execute<RowDataPacket[]>(query, params);
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
  const { startDate, endDate, includeSuspendedAccounts } = filters;
  const { clause: excludedUsernameClause, params: excludedUsernameParams } = buildExcludedUsernameFilter('up.Username');
  const accountStatusClause = buildAccountStatusFilter('up.AccountStatus', includeSuspendedAccounts);
  
  const query = `
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT ufa.ArtistID) as distinct_count
    FROM user_follows_artist ufa
    JOIN userprofile up ON ufa.UserID = up.UserID
    WHERE up.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedUsernameClause}${accountStatusClause}
      AND ufa.FollowedAt >= ? AND ufa.FollowedAt <= ?
  `;
  
  const params = [...excludedUsernameParams, startDate, endDate];
  const [rows] = await pool.execute<RowDataPacket[]>(query, params);
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
  const { startDate, endDate, includeListeners, includeArtists, includeSuspendedAccounts } = filters;
  const { clause: excludedUsernameClause, params: excludedUsernameParams } = buildExcludedUsernameFilter('Username');
  const accountStatusClause = buildAccountStatusFilter('AccountStatus', includeSuspendedAccounts);
  
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
    WHERE UserType IN (${placeholders})${excludedUsernameClause}${accountStatusClause}
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
    [...userTypes, ...excludedUsernameParams, startDate, endDate]
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
  const { startDate, endDate, includeListeners, includeArtists, includeSuspendedAccounts } = filters;
  const { clause: excludedUsernameClause, params: excludedUsernameParams } = buildExcludedUsernameFilter('Username');
  const accountStatusClause = buildAccountStatusFilter('AccountStatus', includeSuspendedAccounts);
  
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
    WHERE UserType IN (${placeholders})${excludedUsernameClause}${accountStatusClause}
      AND DateJoined >= ? AND DateJoined <= ?
    GROUP BY Country
    ORDER BY count DESC, Country ASC
  `;
  
  const [rows] = await pool.execute<RowDataPacket[]>(
    query,
    [...userTypes, ...excludedUsernameParams, startDate, endDate]
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
  const showSongStats = filters.showSongStats !== false;
  const showArtistStats = filters.showArtistStats !== false;
  const showAgeDemographics = filters.showAgeDemographics !== false;

  const listenerUsersPromise = filters.includeListeners
    ? getUsersByType(pool, filters, 'Listener')
    : Promise.resolve([]);
  const artistUsersPromise = filters.includeArtists
    ? getUsersByType(pool, filters, 'Artist')
    : Promise.resolve([]);

  const [
    userCounts,
    loginCounts,
    loginTime,
    songsListened,
    songsUploaded,
    songsLikedStats,
    artistsFollowedStats,
    ageDemographics,
    listenerUsers,
    artistUsers
  ] = await Promise.all([
    getUserCounts(pool, filters),
    getLoginCounts(pool, filters),
    getLoginTime(pool, filters),
    getSongsListened(pool, filters),
    getSongsUploaded(pool, filters),
    getSongsLikedStats(pool, filters),
    getArtistsFollowedStats(pool, filters),
    getAgeDemographics(pool, filters),
    listenerUsersPromise,
    artistUsersPromise
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
    ageDemographics: showAgeDemographics ? ageDemographics : [],
    showSongStats,
    showArtistStats,
    showAgeDemographics,
    includeSuspendedAccounts: !!filters.includeSuspendedAccounts
  };
  
  if (filters.includeListeners) {
    report.listenerUsers = listenerUsers;
  }

  if (filters.includeArtists) {
    report.artistUsers = artistUsers;
  }

  if (filters.includePlaylistStatistics) {
    report.playlistStats = await getPlaylistStats(pool, filters);
    report.playlistActivity = await getPlaylistActivity(pool, filters);
  }
  
  if (filters.includeAlbumStatistics) {
    report.albumStats = await getAlbumStats(pool, filters);
  }
  
  if (filters.includeGeographics) {
    report.countryStats = await getCountryStats(pool, filters);
  }

  if (showSongStats) {
    report.songActivity = await getSongActivity(pool, filters);
  }

  if (filters.includeArtists && showArtistStats) {
    const { artists, albums } = await getArtistActivity(pool, filters);
    report.artistActivity = artists;
    if (filters.includeAlbumStatistics) {
      report.albumActivity = albums;
    }
  }

  return report;
}

// Individual User Analytics Interfaces
export interface IndividualUserReport {
  userDetails: IndividualUserDetails;
  userInfo?: {
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
  listenerSongSummary?: IndividualUserSongSummary;
  listenerSongActivity?: IndividualUserSongActivity[];
  artistSongSummary?: IndividualUserArtistSongSummary;
  artistSongActivity?: IndividualUserArtistSongActivity[];
  listenerArtistActivity?: IndividualUserListenerArtistActivity[];
  listenerAlbumActivity?: IndividualUserListenerAlbumActivity[];
  artistAlbumActivity?: IndividualUserArtistAlbumActivity[];
  listenerPlaylistActivity?: IndividualUserListenerPlaylistActivity[];
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
    SELECT 
      UserID,
      Username,
      FirstName,
      LastName,
      Email,
      UserType,
      DateJoined,
      Country,
      City,
      DateOfBirth,
      AccountStatus,
      ProfilePicture,
      CreatedAt,
      UpdatedAt
    FROM userprofile
    WHERE Username = ?
  `;
  
  let [userRows] = await pool.execute<RowDataPacket[]>(userQuery, [trimmedUsername]);
  
  // If no exact match, try case-insensitive
  if (userRows.length === 0) {
    userQuery = `
      SELECT 
        UserID,
        Username,
        FirstName,
        LastName,
        Email,
        UserType,
        DateJoined,
        Country,
        City,
        DateOfBirth,
        AccountStatus,
        ProfilePicture,
        CreatedAt,
        UpdatedAt
      FROM userprofile
      WHERE LOWER(Username) = LOWER(?)
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
  const city = normalizeCity(user.City);
  const profilePicture = user.ProfilePicture || null;
  const accountStatus = (user.AccountStatus || 'Active') as 'Active' | 'Suspended' | 'Banned';
  const statusDate = user.UpdatedAt ? new Date(user.UpdatedAt).toISOString() : null;

  // Get user's current age using DateOfBirth
  const ageQuery = `
    SELECT TIMESTAMPDIFF(YEAR, DateOfBirth, CURDATE()) as Age
    FROM userprofile
    WHERE UserID = ?
  `;
  const [ageRows] = await pool.execute<RowDataPacket[]>(ageQuery, [userId]);
  const age = ageRows?.[0]?.Age ?? null;

  let verifiedStatus: boolean | null = null;
  let dateVerified: string | null = null;
  if (userType === 'Artist') {
    const artistMetaQuery = `
      SELECT VerifiedStatus, DateVerified
      FROM artist
      WHERE ArtistID = ?
    `;
    const [artistMetaRows] = await pool.execute<RowDataPacket[]>(artistMetaQuery, [userId]);
    if (artistMetaRows && artistMetaRows.length > 0) {
      const artistMeta = artistMetaRows[0];
      if (artistMeta) {
        if (artistMeta.VerifiedStatus != null) {
          verifiedStatus = Number(artistMeta.VerifiedStatus) === 1;
        }
        dateVerified = artistMeta.DateVerified ? new Date(artistMeta.DateVerified).toISOString() : null;
      }
    }
  }

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
  
  const userDetails: IndividualUserDetails = {
    username: user.Username || trimmedUsername,
    firstName: user.FirstName || '',
    lastName: user.LastName || '',
    email: user.Email || '',
    dateOfBirth: user.DateOfBirth ? new Date(user.DateOfBirth).toISOString() : null,
    age: typeof age === 'number' ? Number(age) : null,
    userType,
    accountStatus,
    statusDate,
    profilePicture,
    dateJoined: dateJoined ? new Date(dateJoined).toISOString() : null,
    country,
    city,
    verified: verifiedStatus,
    verificationDate: dateVerified
  };

  const report: IndividualUserReport = {
    userDetails,
    userInfo: {
      dateCreated: userDetails.dateJoined || (dateJoined ? new Date(dateJoined).toISOString() : ''),
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
    
    const totalSongsPlayed = Number(songsPlayedRows[0]?.total || 0);
    const distinctSongsPlayed = Number(songsPlayedRows[0]?.distinct_count || 0);
    const songsLikedCount = Number(songsLikedRows[0]?.total || 0);
    const playlistsLikedTotal = Number(playlistsLikedRows[0]?.total || 0);
    const totalListeningDurationValue = Number(durationRows[0]?.total || 0);
    const averageListeningDurationValue = Math.round(Number(durationRows[0]?.avg || 0));

    report.listenerStats = {
      totalSongsPlayed,
      distinctSongsPlayed,
      playlistsCreated: {
        total: playlistsRows[0]?.total || 0,
        public: playlistsRows[0]?.public || 0,
        private: playlistsRows[0]?.private || 0
      },
      playlistsLiked: playlistsLikedTotal,
      topSongs: topSongsRows.map((row: any) => ({
        songName: row.SongName,
        playCount: row.playCount
      })),
      songsLiked: songsLikedCount,
      totalListeningDuration: totalListeningDurationValue,
      averageListeningDuration: averageListeningDurationValue,
      albumsLiked: albumsLikedRows[0]?.total || 0
    };

    report.listenerSongSummary = {
      totalSongsListened: totalSongsPlayed,
      distinctSongsListened: distinctSongsPlayed,
      songsLiked: songsLikedCount,
      totalListeningDuration: totalListeningDurationValue,
      averageListeningDuration: averageListeningDurationValue
    };

    const songActivityQuery = `
      SELECT
        lh.SongID,
        s.SongName,
        s.Duration AS SongDuration,
        s.ReleaseDate,
        g.GenreName,
        artist.Username AS ArtistUsername,
        SUM(1) AS TotalListens,
        MAX(CASE WHEN uls.UserID IS NOT NULL THEN 1 ELSE 0 END) AS LikedFlag,
        MAX(uls.LikedAt) AS LikedAt
      FROM listening_history lh
      JOIN song s ON lh.SongID = s.SongID
      LEFT JOIN genre g ON g.GenreID = s.GenreID
      LEFT JOIN userprofile artist ON artist.UserID = s.ArtistID
      LEFT JOIN user_likes_song uls
        ON uls.SongID = lh.SongID
        AND uls.UserID = lh.UserID
        AND uls.LikedAt >= ? AND uls.LikedAt <= ?
      WHERE lh.UserID = ?
        AND lh.ListenedAt >= ? AND lh.ListenedAt <= ?
      GROUP BY lh.SongID, s.SongName, s.Duration, s.ReleaseDate, g.GenreName, artist.Username
      ORDER BY TotalListens DESC, s.SongName ASC
    `;

    const [songActivityRows] = await pool.execute<RowDataPacket[]>(songActivityQuery, [
      startDate,
      endDate,
      userId,
      startDate,
      endDate
    ]);

    let listenerSongActivity: IndividualUserSongActivity[] = [];

    if (songActivityRows.length > 0) {
      const songIds = songActivityRows.map((row: any) => Number(row.SongID));
      const placeholders = songIds.map(() => '?').join(', ');

      const listenDetailsQuery = `
        SELECT
          lh.SongID,
          lh.ListenedAt,
          lh.Duration
        FROM listening_history lh
        WHERE lh.UserID = ?
          AND lh.ListenedAt >= ? AND lh.ListenedAt <= ?
          AND lh.SongID IN (${placeholders})
        ORDER BY lh.ListenedAt DESC
      `;

      const listenParams = [userId, startDate, endDate, ...songIds];
      const [listenRows] = await pool.execute<RowDataPacket[]>(listenDetailsQuery, listenParams);

      const listenDetailsMap = new Map<number, IndividualUserSongListenDetail[]>();
      for (const listenRow of listenRows as any[]) {
        const songId = Number(listenRow.SongID);
        const listens = listenDetailsMap.get(songId) ?? [];
        listens.push({
          listenedAt: listenRow.ListenedAt ? new Date(listenRow.ListenedAt).toISOString() : null,
          duration: listenRow.Duration != null ? Number(listenRow.Duration) : 0
        });
        listenDetailsMap.set(songId, listens);
      }

      listenerSongActivity = songActivityRows.map((row: any, idx: number) => {
        const songId = Number(row.SongID);
        const songDuration = row.SongDuration != null ? Number(row.SongDuration) : null;
        const maxDuration =
          songDuration != null && songDuration > 0 ? songDuration : FALLBACK_SONG_DURATION;

        const rawDetails = listenDetailsMap.get(songId) ?? [];
        const normalizedDetails = rawDetails.map((detail) => ({
          listenedAt: detail.listenedAt,
          duration: Math.min(detail.duration || 0, maxDuration)
        }));

        const totalListeningTime = normalizedDetails.reduce(
          (sum, detail) => sum + (detail.duration || 0),
          0
        );
        const totalListenEvents = normalizedDetails.length;
        const averageListeningDuration =
          totalListenEvents > 0
            ? Math.round(Math.min(totalListeningTime / totalListenEvents, maxDuration))
            : 0;

        return {
          songId,
          songName: row.SongName || 'Unknown Song',
          artistUsername: row.ArtistUsername || null,
          releaseDate: row.ReleaseDate ? new Date(row.ReleaseDate).toISOString() : null,
          genre: row.GenreName || null,
          duration: songDuration,
          totalListens: Number(row.TotalListens || normalizedDetails.length || 0),
          liked: Boolean(row.LikedFlag),
          likedAt: row.LikedAt ? new Date(row.LikedAt).toISOString() : null,
          averageListeningDuration,
          totalListeningDuration: totalListeningTime,
          listenDetails: normalizedDetails
        };
      });
    }

    report.listenerSongActivity = listenerSongActivity;
    report.listenerArtistActivity = await getIndividualUserArtistActivity(pool, userId, startDate, endDate);
    try {
      report.listenerAlbumActivity = await getIndividualUserAlbumActivity(pool, userId, startDate, endDate);
    } catch (albumError) {
      console.error('Failed to load listener album activity:', albumError);
      report.listenerAlbumActivity = [];
    }
    try {
      report.listenerPlaylistActivity = await getIndividualUserPlaylistActivity(pool, userId, startDate, endDate);
    } catch (playlistError) {
      console.error('Failed to load listener playlist activity:', playlistError);
      report.listenerPlaylistActivity = [];
    }
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

    const artistSongsQuery = `
      SELECT
        s.SongID,
        s.SongName,
        s.ReleaseDate,
        s.Duration,
        g.GenreName,
        alb.AlbumName,
        SUM(CASE WHEN listener.UserID IS NOT NULL THEN 1 ELSE 0 END) AS TotalListenEvents,
        SUM(CASE WHEN listener.UserID IS NOT NULL THEN COALESCE(lh.Duration, 0) ELSE 0 END) AS TotalListeningDuration,
        SUM(CASE WHEN liker.UserID IS NOT NULL THEN 1 ELSE 0 END) AS TotalLikes
      FROM song s
      LEFT JOIN genre g ON g.GenreID = s.GenreID
      LEFT JOIN album alb ON alb.AlbumID = s.AlbumID
      LEFT JOIN listening_history lh
        ON lh.SongID = s.SongID
        AND lh.ListenedAt >= ? AND lh.ListenedAt <= ?
      LEFT JOIN userprofile listener
        ON listener.UserID = lh.UserID
        AND listener.UserType NOT IN ('Analyst', 'Administrator', 'Developer')
        AND listener.AccountStatus = 'Active'
      LEFT JOIN user_likes_song uls
        ON uls.SongID = s.SongID
        AND uls.LikedAt >= ? AND uls.LikedAt <= ?
      LEFT JOIN userprofile liker
        ON liker.UserID = uls.UserID
        AND liker.UserType NOT IN ('Analyst', 'Administrator', 'Developer')
        AND liker.AccountStatus = 'Active'
      WHERE s.ArtistID = ?
      GROUP BY s.SongID, s.SongName, s.ReleaseDate, s.Duration, g.GenreName, alb.AlbumName
      ORDER BY TotalListenEvents DESC, s.SongName ASC
    `;

    const [artistSongRows] = await pool.execute<RowDataPacket[]>(artistSongsQuery, [
      startDate,
      endDate,
      startDate,
      endDate,
      artistId
    ]);

    let artistSongSummary: IndividualUserArtistSongSummary = {
      totalSongsReleased: 0,
      totalSongLikes: 0,
      totalDistinctSongLikers: 0,
      totalListeningDuration: 0,
      averageListeningDuration: 0
    };

    let artistSongActivity: IndividualUserArtistSongActivity[] = [];

    if (artistSongRows.length > 0) {
      const songIds = artistSongRows.map((row: any) => Number(row.SongID));
      const placeholders = songIds.map(() => '?').join(', ');

      const songListenerDetailsQuery = `
        SELECT
          lh.SongID,
          listener.UserID,
          listener.Username,
          listener.FirstName,
          listener.LastName,
          listener.Email,
          SUM(1) AS ListenCount,
          SUM(COALESCE(lh.Duration, 0)) AS TotalDuration,
          AVG(COALESCE(lh.Duration, 0)) AS AverageDuration
        FROM listening_history lh
        JOIN userprofile listener ON listener.UserID = lh.UserID
        WHERE lh.SongID IN (${placeholders})
          AND lh.ListenedAt >= ? AND lh.ListenedAt <= ?
          AND listener.UserType NOT IN ('Analyst', 'Administrator', 'Developer')
          AND listener.AccountStatus = 'Active'
        GROUP BY lh.SongID, listener.UserID, listener.Username, listener.FirstName, listener.LastName, listener.Email
        ORDER BY ListenCount DESC, listener.Username ASC
      `;

      const listenerDetailParams = [...songIds, startDate, endDate];
      const [songListenerRows] = await pool.execute<RowDataPacket[]>(songListenerDetailsQuery, listenerDetailParams);

      const songLikeDetailsQuery = `
        SELECT
          uls.SongID,
          liker.UserID,
          liker.Username,
          liker.FirstName,
          liker.LastName,
          liker.Email,
          uls.LikedAt
        FROM user_likes_song uls
        JOIN userprofile liker ON liker.UserID = uls.UserID
        WHERE uls.SongID IN (${placeholders})
          AND uls.LikedAt >= ? AND uls.LikedAt <= ?
          AND liker.UserType NOT IN ('Analyst', 'Administrator', 'Developer')
          AND liker.AccountStatus = 'Active'
        ORDER BY uls.LikedAt DESC
      `;

      const likeDetailParams = [...songIds, startDate, endDate];
      const [songLikeRows] = await pool.execute<RowDataPacket[]>(songLikeDetailsQuery, likeDetailParams);

      const listenerMap = new Map<number, IndividualUserArtistSongListenerDetail[]>();
      for (const row of songListenerRows as any[]) {
        const songId = Number(row.SongID);
        const fullName = [row.FirstName, row.LastName].filter(Boolean).join(' ').trim();
        const listenCount = Number(row.ListenCount || 0);
        const totalDuration = Number(row.TotalDuration || 0);
        const averageDuration = Math.round(Number(row.AverageDuration || 0));
        const listeners = listenerMap.get(songId) ?? [];
        listeners.push({
          userId: Number(row.UserID),
          username: row.Username || 'Unknown',
          fullName: fullName || 'N/A',
          email: row.Email || '',
          listenCount,
          totalDuration,
          averageDuration
        });
        listenerMap.set(songId, listeners);
      }

      const likeMap = new Map<number, IndividualUserArtistSongLikeDetail[]>();
      for (const row of songLikeRows as any[]) {
        const songId = Number(row.SongID);
        const fullName = [row.FirstName, row.LastName].filter(Boolean).join(' ').trim();
        const likers = likeMap.get(songId) ?? [];
        likers.push({
          userId: Number(row.UserID),
          username: row.Username || 'Unknown',
          fullName: fullName || 'N/A',
          email: row.Email || '',
          likedAt: row.LikedAt ? new Date(row.LikedAt).toISOString() : null
        });
        likeMap.set(songId, likers);
      }

      let totalSongsReleased = 0;
      let aggregatedSongLikes = 0;
      let aggregatedListeningDuration = 0;
      let aggregatedListenEvents = 0;
      const distinctLikeUsers = new Set<number>();

      artistSongActivity = artistSongRows.map((row: any) => {
        const songId = Number(row.SongID);
        const songDuration = row.Duration != null ? Number(row.Duration) : null;
        const maxDuration = songDuration != null && songDuration > 0 ? songDuration : FALLBACK_SONG_DURATION;
        const totalListens = Number(row.TotalListenEvents || 0);
        const totalListeningDuration = Number(row.TotalListeningDuration || 0);
        const totalLikes = Number(row.TotalLikes || 0);

        const listeners = (listenerMap.get(songId) ?? []).map((listener) => ({
          ...listener,
          totalDuration: Math.min(listener.totalDuration, maxDuration * listener.listenCount),
          averageDuration: Math.min(listener.averageDuration, maxDuration)
        }));

        const likers = likeMap.get(songId) ?? [];
        likers.forEach((liker) => {
          if (liker.userId) {
            distinctLikeUsers.add(liker.userId);
          }
        });

        aggregatedSongLikes += totalLikes;
        aggregatedListeningDuration += totalListeningDuration;
        aggregatedListenEvents += totalListens;
        totalSongsReleased += 1;

        const averageListeningDuration =
          totalListens > 0
            ? Math.round(Math.min(totalListeningDuration / totalListens, maxDuration))
            : 0;

        return {
          songId,
          songName: row.SongName || 'Unknown Song',
          releaseDate: row.ReleaseDate ? new Date(row.ReleaseDate).toISOString() : null,
          albumName: row.AlbumName || null,
          genre: row.GenreName || null,
          duration: songDuration,
          totalListens,
          totalLikes,
          totalListeningDuration,
          averageListeningDuration,
          listeners,
          likers
        };
      });

      const averageListeningDuration =
        aggregatedListenEvents > 0
          ? Math.round(aggregatedListeningDuration / aggregatedListenEvents)
          : 0;

      artistSongSummary = {
        totalSongsReleased,
        totalSongLikes: aggregatedSongLikes,
        totalDistinctSongLikers: distinctLikeUsers.size,
        totalListeningDuration: aggregatedListeningDuration,
        averageListeningDuration
      };
    }

    report.artistSongSummary = artistSongSummary;
    report.artistSongActivity = artistSongActivity;
    try {
      report.artistAlbumActivity = await getIndividualArtistAlbumActivity(pool, artistId, startDate, endDate);
    } catch (albumError) {
      console.error('Failed to load artist album activity:', albumError);
      report.artistAlbumActivity = [];
    }
  }
  
  return report;
}

async function getIndividualUserArtistActivity(
  pool: Pool,
  userId: number,
  startDate: string,
  endDate: string
): Promise<IndividualUserListenerArtistActivity[]> {
  const { clause: excludedArtistClause, params: excludedArtistParams } = buildExcludedUsernameFilter(
    'artist.Username'
  );

  const followQuery = `
    SELECT
      artist.UserID AS ArtistID,
      artist.Username,
      artist.FirstName,
      artist.LastName,
      artist.Country,
      artist.City,
      art.VerifiedStatus,
      ufa.FollowedAt
    FROM user_follows_artist ufa
    JOIN userprofile artist ON artist.UserID = ufa.ArtistID
    LEFT JOIN artist art ON art.ArtistID = artist.UserID
    WHERE ufa.UserID = ?
      AND ufa.FollowedAt >= ? AND ufa.FollowedAt <= ?
      AND artist.UserType = 'Artist'${excludedArtistClause}
    ORDER BY ufa.FollowedAt DESC, artist.Username ASC
  `;

  const followParams = [userId, startDate, endDate, ...excludedArtistParams];
  const [followRows] = await pool.execute<RowDataPacket[]>(followQuery, followParams);

  if (!followRows || followRows.length === 0) {
    return [];
  }

  const artistIds = followRows.map((row: any) => Number(row.ArtistID));
  const uniqueArtistIds = Array.from(new Set(artistIds));
  const placeholders = uniqueArtistIds.map(() => '?').join(', ');

  const songsLikedQuery = `
    SELECT
      s.ArtistID,
      COUNT(*) AS LikedCount
    FROM user_likes_song uls
    JOIN song s ON s.SongID = uls.SongID
    WHERE uls.UserID = ?
      AND uls.LikedAt >= ? AND uls.LikedAt <= ?
      AND s.ArtistID IN (${placeholders})
    GROUP BY s.ArtistID
  `;
  const [songsLikedRows] = await pool.execute<RowDataPacket[]>(songsLikedQuery, [
    userId,
    startDate,
    endDate,
    ...uniqueArtistIds
  ]);

  const songsLikedMap = new Map<number, number>();
  for (const row of songsLikedRows as any[]) {
    const artistId = Number(row.ArtistID);
    songsLikedMap.set(artistId, Number(row.LikedCount || 0));
  }

  const albumsLikedQuery = `
    SELECT
      alb.ArtistID,
      COUNT(*) AS LikedCount
    FROM user_likes_album ula
    JOIN album alb ON alb.AlbumID = ula.AlbumID
    WHERE ula.UserID = ?
      AND ula.LikedAt >= ? AND ula.LikedAt <= ?
      AND alb.ArtistID IN (${placeholders})
    GROUP BY alb.ArtistID
  `;
  const [albumsLikedRows] = await pool.execute<RowDataPacket[]>(albumsLikedQuery, [
    userId,
    startDate,
    endDate,
    ...uniqueArtistIds
  ]);

  const albumsLikedMap = new Map<number, number>();
  for (const row of albumsLikedRows as any[]) {
    const artistId = Number(row.ArtistID);
    albumsLikedMap.set(artistId, Number(row.LikedCount || 0));
  }

  const songsListenedQuery = `
    SELECT
      s.ArtistID,
      COUNT(DISTINCT lh.SongID) AS SongsListened
    FROM listening_history lh
    JOIN song s ON s.SongID = lh.SongID
    WHERE lh.UserID = ?
      AND lh.ListenedAt >= ? AND lh.ListenedAt <= ?
      AND s.ArtistID IN (${placeholders})
    GROUP BY s.ArtistID
  `;
  const [songsListenedRows] = await pool.execute<RowDataPacket[]>(songsListenedQuery, [
    userId,
    startDate,
    endDate,
    ...uniqueArtistIds
  ]);

  const songsListenedMap = new Map<number, number>();
  for (const row of songsListenedRows as any[]) {
    const artistId = Number(row.ArtistID);
    songsListenedMap.set(artistId, Number(row.SongsListened || 0));
  }

  const durationQuery = `
    SELECT
      s.ArtistID,
      s.SongID,
      s.Duration AS SongDuration,
      COUNT(*) AS ListenCount,
      SUM(COALESCE(lh.Duration, 0)) AS TotalDuration
    FROM listening_history lh
    JOIN song s ON s.SongID = lh.SongID
    WHERE lh.UserID = ?
      AND lh.ListenedAt >= ? AND lh.ListenedAt <= ?
      AND s.ArtistID IN (${placeholders})
    GROUP BY s.ArtistID, s.SongID, s.Duration
  `;
  const [durationRows] = await pool.execute<RowDataPacket[]>(durationQuery, [
    userId,
    startDate,
    endDate,
    ...uniqueArtistIds
  ]);

  const durationMap = new Map<number, number>();
  for (const row of durationRows as any[]) {
    const artistId = Number(row.ArtistID);
    const songDuration = row.SongDuration != null ? Number(row.SongDuration) : null;
    const maxDuration = songDuration != null && songDuration > 0 ? songDuration : FALLBACK_SONG_DURATION;
    const listenCount = Number(row.ListenCount || 0);
    const rawTotal = Number(row.TotalDuration || 0);
    const normalizedTotal = Math.min(rawTotal, maxDuration * listenCount);
    durationMap.set(artistId, (durationMap.get(artistId) ?? 0) + normalizedTotal);
  }

  return followRows.map((row: any) => {
    const artistId = Number(row.ArtistID);
    const fullName = [row.FirstName, row.LastName].filter(Boolean).join(' ').trim();
    const verifiedStatus = row.VerifiedStatus != null ? Number(row.VerifiedStatus) : 0;

    return {
      artistId,
      username: row.Username || 'Unknown Artist',
      fullName: fullName || 'N/A',
      country: row.Country || null,
      city: normalizeCity(row.City),
      verified: verifiedStatus === 1,
      songsLikedCount: songsLikedMap.get(artistId) ?? 0,
      songsListenedCount: songsListenedMap.get(artistId) ?? 0,
      albumsLikedCount: albumsLikedMap.get(artistId) ?? 0,
      totalListeningDuration: durationMap.get(artistId) ?? 0,
      followedAt: row.FollowedAt ? new Date(row.FollowedAt).toISOString() : null
    };
  });
}

async function getIndividualUserAlbumActivity(
  pool: Pool,
  userId: number,
  startDate: string,
  endDate: string
): Promise<IndividualUserListenerAlbumActivity[]> {
  const likedAlbumsQuery = `
    SELECT
      alb.AlbumID,
      alb.AlbumName,
      alb.ReleaseDate,
      artist.Username AS ArtistUsername,
      ula.LikedAt
    FROM user_likes_album ula
    JOIN album alb ON alb.AlbumID = ula.AlbumID
    LEFT JOIN userprofile artist ON artist.UserID = alb.ArtistID
    WHERE ula.UserID = ?
      AND ula.LikedAt >= ? AND ula.LikedAt <= ?
    ORDER BY ula.LikedAt DESC, alb.ReleaseDate DESC, alb.AlbumName ASC
  `;

  const [likedRows] = await pool.execute<RowDataPacket[]>(likedAlbumsQuery, [userId, startDate, endDate]);
  if (!likedRows || likedRows.length === 0) {
    return [];
  }

  const albumIds = likedRows.map((row: any) => Number(row.AlbumID));
  const placeholders = albumIds.map(() => '?').join(', ');

  const songsLikedQuery = `
    SELECT
      s.AlbumID,
      COUNT(*) AS SongsLiked
    FROM user_likes_song uls
    JOIN song s ON s.SongID = uls.SongID
    WHERE uls.UserID = ?
      AND uls.LikedAt >= ? AND uls.LikedAt <= ?
      AND s.AlbumID IN (${placeholders})
    GROUP BY s.AlbumID
  `;
  const [songsLikedRows] = await pool.execute<RowDataPacket[]>(songsLikedQuery, [
    userId,
    startDate,
    endDate,
    ...albumIds
  ]);
  const songsLikedMap = new Map<number, number>();
  for (const row of songsLikedRows as any[]) {
    songsLikedMap.set(Number(row.AlbumID), Number(row.SongsLiked || 0));
  }

  const durationQuery = `
    SELECT
      s.AlbumID,
      s.SongID,
      s.Duration AS SongDuration,
      COUNT(*) AS ListenCount,
      SUM(COALESCE(lh.Duration, 0)) AS TotalDuration
    FROM listening_history lh
    JOIN song s ON s.SongID = lh.SongID
    WHERE lh.UserID = ?
      AND lh.ListenedAt >= ? AND lh.ListenedAt <= ?
      AND s.AlbumID IN (${placeholders})
    GROUP BY s.AlbumID, s.SongID, s.Duration
  `;
  const [durationRows] = await pool.execute<RowDataPacket[]>(durationQuery, [
    userId,
    startDate,
    endDate,
    ...albumIds
  ]);

  const durationMap = new Map<number, number>();
  for (const row of durationRows as any[]) {
    const albumId = Number(row.AlbumID);
    const songDuration = row.SongDuration != null ? Number(row.SongDuration) : null;
    const maxDuration = songDuration != null && songDuration > 0 ? songDuration : FALLBACK_SONG_DURATION;
    const listenCount = Number(row.ListenCount || 0);
    const rawTotal = Number(row.TotalDuration || 0);
    const normalized = Math.min(rawTotal, maxDuration * listenCount);
    durationMap.set(albumId, (durationMap.get(albumId) ?? 0) + normalized);
  }

  return likedRows.map((row: any) => {
    const albumId = Number(row.AlbumID);
    return {
      albumId,
      albumName: row.AlbumName || 'Untitled Album',
      releaseDate: row.ReleaseDate ? new Date(row.ReleaseDate).toISOString() : null,
      artistUsername: row.ArtistUsername || null,
      likedAt: row.LikedAt ? new Date(row.LikedAt).toISOString() : null,
      songsLikedCount: songsLikedMap.get(albumId) ?? 0,
      totalListeningDuration: durationMap.get(albumId) ?? 0
    };
  });
}

async function getIndividualArtistAlbumActivity(
  pool: Pool,
  artistId: number,
  startDate: string,
  endDate: string
): Promise<IndividualUserArtistAlbumActivity[]> {
  const albumQuery = `
    SELECT
      alb.AlbumID,
      alb.AlbumName,
      alb.ArtistID,
      alb.ReleaseDate
    FROM album alb
    WHERE alb.ArtistID = ?
      AND alb.ReleaseDate >= ? AND alb.ReleaseDate <= ?
    ORDER BY alb.ReleaseDate DESC, alb.AlbumName ASC
  `;
  const [albumRows] = await pool.execute<RowDataPacket[]>(albumQuery, [artistId, startDate, endDate]);
  if (!albumRows || albumRows.length === 0) {
    return [];
  }

  const albumIds = albumRows.map((row: any) => Number(row.AlbumID));
  const placeholders = albumIds.map(() => '?').join(', ');

  const { clause: excludedListenerClause, params: excludedListenerParams } = buildExcludedUsernameFilter(
    'listener.Username'
  );
  const listenerStatusClause = buildAccountStatusFilter('listener.AccountStatus', false);
  const { clause: excludedLikerClause, params: excludedLikerParams } = buildExcludedUsernameFilter('liker.Username');
  const likerStatusClause = buildAccountStatusFilter('liker.AccountStatus', false);

  const likesQuery = `
    SELECT
      alb.AlbumID,
      COUNT(*) AS Likes,
      COUNT(DISTINCT ula.UserID) AS UniqueUsers
    FROM user_likes_album ula
    JOIN album alb ON alb.AlbumID = ula.AlbumID
    JOIN userprofile liker ON liker.UserID = ula.UserID
    WHERE alb.AlbumID IN (${placeholders})
      AND ula.LikedAt >= ? AND ula.LikedAt <= ?
      AND liker.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedLikerClause}${likerStatusClause}
    GROUP BY alb.AlbumID
  `;
  const [likesRows] = await pool.execute<RowDataPacket[]>(likesQuery, [
    ...albumIds,
    startDate,
    endDate,
    ...excludedLikerParams
  ]);

  const likesMap = new Map<number, { likes: number; uniqueUsers: number }>();
  for (const row of likesRows as any[]) {
    likesMap.set(Number(row.AlbumID), {
      likes: Number(row.Likes || 0),
      uniqueUsers: Number(row.UniqueUsers || 0)
    });
  }

  const durationQuery = `
    SELECT
      s.AlbumID,
      SUM(COALESCE(lh.Duration, 0)) AS TotalDuration
    FROM listening_history lh
    JOIN song s ON s.SongID = lh.SongID
    JOIN userprofile listener ON listener.UserID = lh.UserID
    WHERE s.AlbumID IN (${placeholders})
      AND lh.ListenedAt >= ? AND lh.ListenedAt <= ?
      AND listener.UserID <> ?
      AND listener.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedListenerClause}${listenerStatusClause}
    GROUP BY s.AlbumID
  `;
  const [durationRows] = await pool.execute<RowDataPacket[]>(durationQuery, [
    ...albumIds,
    startDate,
    endDate,
    artistId,
    ...excludedListenerParams
  ]);

  const durationMap = new Map<number, number>();
  for (const row of durationRows as any[]) {
    durationMap.set(Number(row.AlbumID), Number(row.TotalDuration || 0));
  }

  const songQuery = `
    SELECT
      s.AlbumID,
      s.SongID,
      s.SongName,
      s.Duration,
      g.GenreName
    FROM song s
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE s.AlbumID IN (${placeholders})
    ORDER BY s.ReleaseDate ASC, s.SongName ASC
  `;
  const [songRows] = await pool.execute<RowDataPacket[]>(songQuery, [...albumIds]);

  const songMap = new Map<number, IndividualUserArtistAlbumSongDetail[]>();
  for (const row of songRows as any[]) {
    const albumId = Number(row.AlbumID);
    const duration = row.Duration != null ? Number(row.Duration) : null;
    const entry = songMap.get(albumId) ?? [];
    entry.push({
      songId: Number(row.SongID),
      songName: row.SongName || 'Unknown Song',
      duration,
      genre: row.GenreName || null
    });
    songMap.set(albumId, entry);
  }

  return albumRows.map((row: any) => {
    const albumId = Number(row.AlbumID);
    const likes = likesMap.get(albumId);
    return {
      albumId,
      albumName: row.AlbumName || 'Untitled Album',
      releaseDate: row.ReleaseDate ? new Date(row.ReleaseDate).toISOString() : null,
      likesCount: likes?.likes ?? 0,
      uniqueUserLikes: likes?.uniqueUsers ?? 0,
      totalListeningDuration: durationMap.get(albumId) ?? 0,
      songs: songMap.get(albumId) ?? []
    };
  });
}

async function getIndividualUserPlaylistActivity(
  pool: Pool,
  userId: number,
  startDate: string,
  endDate: string
): Promise<IndividualUserListenerPlaylistActivity[]> {
  const { clause: excludedLikerClause, params: excludedLikerParams } = buildExcludedUsernameFilter('liker.Username');
  const likerStatusClause = buildAccountStatusFilter('liker.AccountStatus', false);

  const playlistQuery = `
    SELECT DISTINCT
      p.PlaylistID,
      p.PlaylistName,
      p.IsPublic,
      p.CreatedAt
    FROM playlist p
    WHERE p.UserID = ?
      AND (
        (p.CreatedAt >= ? AND p.CreatedAt <= ?)
        OR EXISTS (
          SELECT 1
          FROM playlist_song ps
          WHERE ps.PlaylistID = p.PlaylistID
            AND ps.AddedAt >= ? AND ps.AddedAt <= ?
        )
        OR (p.IsPublic = 1 AND EXISTS (
          SELECT 1
          FROM user_likes_playlist ulp
          WHERE ulp.PlaylistID = p.PlaylistID
            AND ulp.LikedAt >= ? AND ulp.LikedAt <= ?
        ))
      )
    ORDER BY p.CreatedAt DESC, p.PlaylistName ASC
  `;

  const [playlistRows] = await pool.execute<RowDataPacket[]>(playlistQuery, [
    userId,
    startDate,
    endDate,
    startDate,
    endDate,
    startDate,
    endDate
  ]);

  if (!playlistRows || playlistRows.length === 0) {
    return [];
  }

  const playlistIds = playlistRows.map((row: any) => Number(row.PlaylistID));
  const placeholders = playlistIds.map(() => '?').join(', ');

  const songsQuery = `
    SELECT
      ps.PlaylistID,
      s.SongID,
      s.SongName,
      COALESCE(artist.Username, 'Unknown Artist') AS ArtistUsername,
      alb.AlbumName,
      s.Duration,
      ps.AddedAt
    FROM playlist_song ps
    JOIN song s ON s.SongID = ps.SongID
    LEFT JOIN userprofile artist ON artist.UserID = s.ArtistID
    LEFT JOIN album alb ON alb.AlbumID = s.AlbumID
    WHERE ps.PlaylistID IN (${placeholders})
    ORDER BY ps.AddedAt DESC, s.SongName ASC
  `;
  const [songRows] = await pool.execute<RowDataPacket[]>(songsQuery, [...playlistIds]);

  const publicPlaylistIds = playlistRows
    .filter((row: any) => Number(row.IsPublic) === 1)
    .map((row: any) => Number(row.PlaylistID));

  let likedRows: RowDataPacket[] = [];
  if (publicPlaylistIds.length > 0) {
    const publicPlaceholders = publicPlaylistIds.map(() => '?').join(', ');
    const likesQuery = `
      SELECT
        ulp.PlaylistID,
        liker.UserID,
        liker.Username,
        liker.FirstName,
        liker.LastName,
        liker.Email,
        ulp.LikedAt
      FROM user_likes_playlist ulp
      JOIN userprofile liker ON liker.UserID = ulp.UserID
      WHERE ulp.PlaylistID IN (${publicPlaceholders})
        AND ulp.LikedAt >= ? AND ulp.LikedAt <= ?
        AND liker.UserType NOT IN ('Analyst', 'Administrator', 'Developer')${excludedLikerClause}${likerStatusClause}
      ORDER BY ulp.LikedAt DESC
    `;
    const [likesResult] = await pool.execute<RowDataPacket[]>(likesQuery, [
      ...publicPlaylistIds,
      startDate,
      endDate,
      ...excludedLikerParams
    ]);
    likedRows = likesResult;
  }

  const songMap = new Map<number, IndividualUserListenerPlaylistSongDetail[]>();
  const durationMap = new Map<number, number>();
  for (const row of songRows as any[]) {
    const playlistId = Number(row.PlaylistID);
    const duration = row.Duration != null ? Number(row.Duration) : null;
    const entry = songMap.get(playlistId) ?? [];
    entry.push({
      songId: Number(row.SongID),
      songName: row.SongName || 'Unknown Song',
      artistUsername: row.ArtistUsername || null,
      albumName: row.AlbumName || null,
      duration,
      addedAt: row.AddedAt ? new Date(row.AddedAt).toISOString() : null
    });
    songMap.set(playlistId, entry);
    if (duration != null) {
      durationMap.set(playlistId, (durationMap.get(playlistId) ?? 0) + duration);
    }
  }

  const likesMap = new Map<number, IndividualUserListenerPlaylistLikeDetail[]>();
  for (const row of likedRows as any[]) {
    const playlistId = Number(row.PlaylistID);
    const likedUsers = likesMap.get(playlistId) ?? [];
    likedUsers.push({
      userId: Number(row.UserID),
      username: row.Username || 'Unknown',
      firstName: row.FirstName || null,
      lastName: row.LastName || null,
      email: row.Email || null,
      likedAt: row.LikedAt ? new Date(row.LikedAt).toISOString() : null
    });
    likesMap.set(playlistId, likedUsers);
  }

  return playlistRows.map((row: any) => {
    const playlistId = Number(row.PlaylistID);
    const isPublic = Number(row.IsPublic) === 1;
    const songs = songMap.get(playlistId) ?? [];
    const likedBy = isPublic ? likesMap.get(playlistId) ?? [] : [];

    return {
      playlistId,
      playlistName: row.PlaylistName || 'Untitled Playlist',
      isPublic,
      createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : null,
      songCount: songs.length,
      totalDuration: durationMap.get(playlistId) ?? 0,
      likes: isPublic ? likedBy.length : 0,
      songs,
      likedBy
    };
  });
}

