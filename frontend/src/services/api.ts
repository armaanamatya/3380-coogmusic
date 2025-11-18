// Centralized API service for CoogMusic
// All API endpoints are defined here to ensure consistency

// Normalize API_BASE by removing trailing slashes
const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001').replace(/\/+$/, '');

// Types for API responses
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// Auth endpoints
export const authApi = {
  register: (formData: FormData) => 
    fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      body: formData
    }),
  
  login: (credentials: { username: string; password: string }) =>
    fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })
};

// Legacy alias for backwards compatibility with additional login tracking methods
export const loginApi = {
  ...authApi,
  logout: (userId: number) =>
    fetch(`${API_BASE}/api/login/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    }),
  updateActivity: (userId: number, activities: {
    songsPlayed: number;
    songsLiked: number;
    artistsFollowed: number;
    songsUploaded: number;
  }) =>
    fetch(`${API_BASE}/api/login/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...activities })
    })
};

// Analytics endpoints
export const analyticsApi = {
  getReport: (filters: {
    startDate: string;
    endDate: string;
    includeListeners: boolean;
    includeArtists: boolean;
    includePlaylistStatistics: boolean;
    includeAlbumStatistics: boolean;
    includeGeographics: boolean;
    showSongStats?: boolean;
    showArtistStats?: boolean;
    showAgeDemographics?: boolean;
    includeSuspendedAccounts?: boolean;
  }) =>
    fetch(`${API_BASE}/api/analytics/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters)
    }),
  getIndividualReport: (data: {
    username: string;
    startDate: string;
    endDate: string;
  }) =>
    fetch(`${API_BASE}/api/analytics/individual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
};

// Song endpoints
export const songApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    artistId?: number; 
    genreId?: number; 
    albumId?: number;
  }) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString() : '';
    return fetch(`${API_BASE}/api/song${query ? '?' + query : ''}`);
  },

  getById: (id: number) => 
    fetch(`${API_BASE}/api/song/${id}`),

  getTop: () => 
    fetch(`${API_BASE}/api/song/top`),

  upload: (formData: FormData) =>
    fetch(`${API_BASE}/api/song/upload`, {
      method: 'POST',
      body: formData
    }),

  update: (id: number, data: any) =>
    fetch(`${API_BASE}/api/song/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  delete: (id: number) =>
    fetch(`${API_BASE}/api/song/${id}`, {
      method: 'DELETE'
    })
};

// Album endpoints
export const albumApi = {
  getAll: (artistId?: number) => {
    const query = artistId ? `?artistId=${artistId}` : '';
    return fetch(`${API_BASE}/api/albums${query}`);
  },

  getById: (id: number) =>
    fetch(`${API_BASE}/api/albums/${id}`),

  create: (data: {
    albumName: string;
    artistId: number;
    releaseDate: string;
    description?: string;
  }) =>
    fetch(`${API_BASE}/api/albums`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  update: (id: number, data: any) =>
    fetch(`${API_BASE}/api/albums/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  delete: (id: number) =>
    fetch(`${API_BASE}/api/albums/${id}`, {
      method: 'DELETE'
    }),

  getTop: () => 
    fetch(`${API_BASE}/api/albums/top`),

  getStats: (id: number) =>
    fetch(`${API_BASE}/api/albums/${id}/stats`)
};

// Artist endpoints
export const artistApi = {
  getAll: () => 
    fetch(`${API_BASE}/api/artists`),
  getTop: () => 
    fetch(`${API_BASE}/api/artists/top`),
  getRecommended: () => 
    fetch(`${API_BASE}/api/artists/recommended`),
  getById: (id: number) =>
    fetch(`${API_BASE}/api/artists/${id}`),
  getAlbums: (id: number) =>
    fetch(`${API_BASE}/api/artists/${id}/albums`),
  getSongs: (id: number) =>
    fetch(`${API_BASE}/api/artists/${id}/songs`),
  getStats: (id: number) =>
    fetch(`${API_BASE}/api/artists/${id}/stats`)
};

// Genre endpoints
export const genreApi = {
  getAll: () => 
    fetch(`${API_BASE}/api/genres`),
  getAllWithListens: () => 
    fetch(`${API_BASE}/api/genres/with-listens`),
  getById: (id: number) =>
    fetch(`${API_BASE}/api/genres/${id}`),
  getSongs: (id: number) =>
    fetch(`${API_BASE}/api/genres/${id}/songs`),
  getAlbums: (id: number) =>
    fetch(`${API_BASE}/api/genres/${id}/albums`)
};

// Health check endpoints
export const healthApi = {
  check: () => 
    fetch(`${API_BASE}/api/health`),
  
  test: () => 
    fetch(`${API_BASE}/api/test`),
  
  testDb: () => 
    fetch(`${API_BASE}/api/test-db`)
};

// File serving
export const getFileUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // Ensure path starts with /uploads/ for proper URL construction
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const uploadsPath = normalizedPath.startsWith('/uploads/') ? normalizedPath : `/uploads${normalizedPath}`;
  return `${API_BASE}${uploadsPath}`;
};

// User endpoints
export const userApi = {
  getById: (userId: number) =>
    fetch(`${API_BASE}/api/users/${userId}`),
  
  update: (userId: number, data: any) =>
    fetch(`${API_BASE}/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  updateProfilePicture: (userId: number, file: File) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    return fetch(`${API_BASE}/api/users/${userId}/profile-picture`, {
      method: 'POST',
      body: formData
    });
  },
  
  search: (query: string) =>
    fetch(`${API_BASE}/api/users/search?query=${encodeURIComponent(query)}`),
  
  getLikedSongs: (userId: number) =>
    fetch(`${API_BASE}/api/users/${userId}/liked-songs`),
  
  getFollowing: (userId: number, params?: { page?: number; limit?: number }) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString() : '';
    return fetch(`${API_BASE}/api/users/${userId}/following${query ? '?' + query : ''}`);
  },
  
  getHistory: (userId: number, params?: { page?: number; limit?: number }) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString() : '';
    return fetch(`${API_BASE}/api/users/${userId}/history${query ? '?' + query : ''}`);
  }
};

// Playlist endpoints
export const playlistApi = {
  getAll: (params?: { userId?: number; page?: number; limit?: number }) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString() : '';
    return fetch(`${API_BASE}/api/playlists${query ? '?' + query : ''}`);
  },

  getById: (playlistId: number) =>
    fetch(`${API_BASE}/api/playlists/${playlistId}`),

  create: (data: {
    playlistName: string;
    userId: number;
    description?: string;
    isPublic?: boolean;
  }) =>
    fetch(`${API_BASE}/api/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  update: (playlistId: number, data: any) =>
    fetch(`${API_BASE}/api/playlists/${playlistId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  delete: (playlistId: number) =>
    fetch(`${API_BASE}/api/playlists/${playlistId}`, {
      method: 'DELETE'
    }),

  getSongs: (playlistId: number) =>
    fetch(`${API_BASE}/api/playlists/${playlistId}/songs`),

  addSong: (playlistId: number, songId: number) =>
    fetch(`${API_BASE}/api/playlists/${playlistId}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songId })
    }),

  removeSong: (playlistId: number, songId: number) =>
    fetch(`${API_BASE}/api/playlists/${playlistId}/songs/${songId}`, {
      method: 'DELETE'
    }),

  getTop: () => 
    fetch(`${API_BASE}/api/playlists/top`),

  getStats: (id: number) =>
    fetch(`${API_BASE}/api/playlists/${id}/stats`)
};

// Like endpoints
export const likeApi = {
  likeSong: (userId: number, songId: number) =>
    fetch(`${API_BASE}/api/likes/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, songId })
    }),

  unlikeSong: (userId: number, songId: number) =>
    fetch(`${API_BASE}/api/likes/songs`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, songId })
    }),

  likeAlbum: (userId: number, albumId: number) =>
    fetch(`${API_BASE}/api/likes/albums`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, albumId })
    }),

  unlikeAlbum: (userId: number, albumId: number) =>
    fetch(`${API_BASE}/api/likes/albums`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, albumId })
    }),

  likePlaylist: (userId: number, playlistId: number) =>
    fetch(`${API_BASE}/api/likes/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, playlistId })
    }),

  unlikePlaylist: (userId: number, playlistId: number) =>
    fetch(`${API_BASE}/api/likes/playlists`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, playlistId })
    })
};

// Follow endpoints
export const followApi = {
  followArtist: (userId: number, artistId: number) =>
    fetch(`${API_BASE}/api/follows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, artistId })
    }),

  unfollowArtist: (userId: number, artistId: number) =>
    fetch(`${API_BASE}/api/follows`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, artistId })
    }),

  checkFollowStatus: (userId: number, artistId: number) =>
    fetch(`${API_BASE}/api/users/${userId}/following/${artistId}`),

  getArtistFollowers: (artistId: number, params?: { page?: number; limit?: number }) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString() : '';
    return fetch(`${API_BASE}/api/artists/${artistId}/followers${query ? '?' + query : ''}`);
  }
};

// History endpoints
export const historyApi = {
  add: (data: {
    userId: number;
    songId: number;
    duration?: number;
  }) =>
    fetch(`${API_BASE}/api/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  getTrending: (params?: { days?: number; limit?: number }) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString() : '';
    return fetch(`${API_BASE}/api/trending${query ? '?' + query : ''}`);
  }
};

// Search endpoints
export const searchApi = {
  search: (query: string) =>
    fetch(`${API_BASE}/api/search?query=${encodeURIComponent(query)}`)
};

// Export base URL for direct use if needed
export const API_BASE_URL = API_BASE;

