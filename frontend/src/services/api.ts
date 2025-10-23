// Centralized API service for CoogMusic
// All API endpoints are defined here to ensure consistency

const API_BASE = 'http://localhost:3001';

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
    })
};

// Artist endpoints
export const artistApi = {
  getAll: () => 
    fetch(`${API_BASE}/api/artists`)
};

// Genre endpoints
export const genreApi = {
  getAll: () => 
    fetch(`${API_BASE}/api/genres`)
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
  return path.startsWith('http') ? path : `${API_BASE}${path}`;
};

// Export base URL for direct use if needed
export const API_BASE_URL = API_BASE;

