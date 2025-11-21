import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL } from '../services/api';

interface User {
  UserID: number;
  Username: string;
  FirstName: string;
  LastName: string;
  Email: string;
  UserType: string;
  DateOfBirth?: string;
  DateJoined: string;
  Country: string;
  City?: string;
  IsOnline: number;
  AccountStatus: string;
  ProfilePicture?: string;
  LastLogin?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

interface Song {
  SongID: number;
  Title: string;
  Duration: number;
  ReleaseDate: string;
  FilePath: string;
  ArtistName: string;
  FirstName: string;
  LastName: string;
  AlbumTitle?: string;
  GenreName?: string;
  LikeCount: number;
  PlayCount: number;
}

interface Album {
  AlbumID: number;
  Title: string;
  ReleaseDate: string;
  CoverImagePath?: string;
  ArtistName: string;
  FirstName: string;
  LastName: string;
  SongCount: number;
  LikeCount: number;
}

interface Playlist {
  PlaylistID: number;
  PlaylistName: string;
  DateCreated: string;
  IsPublic: number;
  CreatorName: string;
  FirstName: string;
  LastName: string;
  SongCount: number;
  LikeCount: number;
}

interface Stats {
  totalUsers: number;
  totalSongs: number;
  totalAlbums: number;
  totalPlaylists: number;
  activeUsers: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Pagination component - defined outside to prevent recreation on each render
const PaginationControls: React.FC<{
  pagination: Pagination;
  onPageChange: (page: number) => void;
}> = ({ pagination, onPageChange }) => (
  <div className="flex items-center justify-between px-6 py-3 bg-red-50 border-t border-red-200">
    <div className="flex items-center text-sm text-gray-600">
      <span>
        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
      </span>
    </div>
    <div className="flex items-center space-x-2">
      <button
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={!pagination.hasPrev}
        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
          pagination.hasPrev 
            ? 'bg-white text-red-700 border border-red-300 hover:bg-red-50' 
            : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
        }`}
      >
        ← Previous
      </button>
      <span className="px-3 py-2 text-sm font-medium text-gray-700">
        Page {pagination.page} of {pagination.totalPages}
      </span>
      <button
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={!pagination.hasNext}
        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
          pagination.hasNext 
            ? 'bg-white text-red-700 border border-red-300 hover:bg-red-50' 
            : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
        }`}
      >
        Next →
      </button>
    </div>
  </div>
);

// Search component - defined outside to prevent recreation on each render
const SearchInput: React.FC<{
  value: string;
  onSearch: (value: string) => void;
  placeholder: string;
}> = ({ value, onSearch, placeholder }) => (
  <div className="px-6 py-4 bg-red-50 border-b border-red-200">
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onSearch(e.target.value)}
      className="w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
    />
  </div>
);

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'songs' | 'albums' | 'playlists'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Pagination state
  const [usersPagination, setUsersPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
  const [songsPagination, setSongsPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
  const [albumsPagination, setAlbumsPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
  const [playlistsPagination, setPlaylistsPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
  
  // Search state
  const [usersSearch, setUsersSearch] = useState('');
  const [songsSearch, setSongsSearch] = useState('');
  const [albumsSearch, setAlbumsSearch] = useState('');
  const [playlistsSearch, setPlaylistsSearch] = useState('');

  // Debounced search states
  const [debouncedUsersSearch, setDebouncedUsersSearch] = useState('');
  const [debouncedSongsSearch, setDebouncedSongsSearch] = useState('');
  const [debouncedAlbumsSearch, setDebouncedAlbumsSearch] = useState('');
  const [debouncedPlaylistsSearch, setDebouncedPlaylistsSearch] = useState('');

  // Filter state for users
  const [usersFilters, setUsersFilters] = useState({
    dateOfBirthTo: '',
    dateJoinedTo: '',
    country: '',
    city: '',
    userType: '',
    accountStatus: '',
    createdAtTo: '',
    updatedAtTo: ''
  });

  // Debounced filter states
  const [debouncedUsersFilters, setDebouncedUsersFilters] = useState(usersFilters);

  // Filter options state
  const [filterOptions, setFilterOptions] = useState<{
    countries: string[];
    cities: string[];
  }>({
    countries: [],
    cities: []
  });

  // Filter panel collapse state
  const [usersFiltersOpen, setUsersFiltersOpen] = useState(false);

  const adminCredentials = {
    username: 'admin',
    password: 'admin'
  };

  // Debounce search inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsersSearch(usersSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [usersSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSongsSearch(songsSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [songsSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAlbumsSearch(albumsSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [albumsSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPlaylistsSearch(playlistsSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [playlistsSearch]);

  const fetchWithAdminAuth = async (url: string, additionalData?: any) => {
    const requestBody = {
      ...adminCredentials,
      ...additionalData
    };
    
    return fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAdminAuth('/api/admin/stats');
      const data = await response.json();
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserFilterOptions = async () => {
    try {
      const response = await fetchWithAdminAuth('/api/admin/users/filter-options');
      const data = await response.json();
      if (data.countries && data.cities) {
        setFilterOptions({
          countries: data.countries,
          cities: data.cities
        });
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchUsers = async (page?: number, search?: string, filters?: typeof usersFilters) => {
    setLoading(true);
    const currentPage = page || usersPagination.page;
    const searchQuery = search !== undefined ? search : usersSearch;
    const currentFilters = filters || debouncedUsersFilters;
    
    try {
      const response = await fetchWithAdminAuth('/api/admin/users', {
        page: currentPage,
        limit: 20,
        search: searchQuery,
        ...currentFilters
      });
      const data = await response.json();
      if (data.users && data.pagination) {
        setUsers(data.users);
        setUsersPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSongs = async (page?: number, search?: string) => {
    setLoading(true);
    const currentPage = page || songsPagination.page;
    const searchQuery = search !== undefined ? search : songsSearch;
    
    try {
      const response = await fetchWithAdminAuth('/api/admin/songs', {
        page: currentPage,
        limit: 20,
        search: searchQuery
      });
      const data = await response.json();
      if (data.songs && data.pagination) {
        setSongs(data.songs);
        setSongsPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbums = async (page?: number, search?: string) => {
    setLoading(true);
    const currentPage = page || albumsPagination.page;
    const searchQuery = search !== undefined ? search : albumsSearch;
    
    try {
      const response = await fetchWithAdminAuth('/api/admin/albums', {
        page: currentPage,
        limit: 20,
        search: searchQuery
      });
      const data = await response.json();
      if (data.albums && data.pagination) {
        setAlbums(data.albums);
        setAlbumsPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylists = async (page?: number, search?: string) => {
    setLoading(true);
    const currentPage = page || playlistsPagination.page;
    const searchQuery = search !== undefined ? search : playlistsSearch;
    
    try {
      const response = await fetchWithAdminAuth('/api/admin/playlists', {
        page: currentPage,
        limit: 20,
        search: searchQuery
      });
      const data = await response.json();
      if (data.playlists && data.pagination) {
        setPlaylists(data.playlists);
        setPlaylistsPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const banUser = async (userId: number) => {
    if (!confirm('Are you sure you want to ban this user?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminCredentials),
      });
      
      if (response.ok) {
        alert('User banned successfully');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Error banning user');
    }
  };

  const deleteSong = async (songId: number) => {
    if (!confirm('Are you sure you want to delete this song?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/songs/${songId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminCredentials),
      });
      
      if (response.ok) {
        alert('Song deleted successfully');
        fetchSongs();
      }
    } catch (error) {
      console.error('Error deleting song:', error);
      alert('Error deleting song');
    }
  };

  const deleteAlbum = async (albumId: number) => {
    if (!confirm('Are you sure you want to delete this album?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/albums/${albumId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminCredentials),
      });
      
      if (response.ok) {
        alert('Album deleted successfully');
        fetchAlbums();
      }
    } catch (error) {
      console.error('Error deleting album:', error);
      alert('Error deleting album');
    }
  };

  const deletePlaylist = async (playlistId: number) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/playlists/${playlistId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminCredentials),
      });
      
      if (response.ok) {
        alert('Playlist deleted successfully');
        fetchPlaylists();
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
      alert('Error deleting playlist');
    }
  };

  // Pagination handlers
  const handleUsersPageChange = (page: number) => {
    fetchUsers(page);
  };

  const handleSongsPageChange = (page: number) => {
    fetchSongs(page);
  };

  const handleAlbumsPageChange = (page: number) => {
    fetchAlbums(page);
  };

  const handlePlaylistsPageChange = (page: number) => {
    fetchPlaylists(page);
  };

  // Search handlers - only update state, fetching is triggered by debounced values
  const handleUsersSearch = (search: string) => {
    setUsersSearch(search);
  };

  const handleSongsSearch = (search: string) => {
    setSongsSearch(search);
  };

  const handleAlbumsSearch = (search: string) => {
    setAlbumsSearch(search);
  };

  const handlePlaylistsSearch = (search: string) => {
    setPlaylistsSearch(search);
  };

  // Filter handlers
  const handleFilterChange = (filterKey: keyof typeof usersFilters, value: string) => {
    setUsersFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const handleClearFilters = () => {
    setUsersFilters({
      dateOfBirthTo: '',
      dateJoinedTo: '',
      country: '',
      city: '',
      userType: '',
      accountStatus: '',
      createdAtTo: '',
      updatedAtTo: ''
    });
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    } else if (activeTab === 'users') {
      fetchUserFilterOptions();
      // Don't fetch users here - let the debounced effect handle it
    } else if (activeTab === 'songs') {
      // Don't fetch songs here - let the debounced effect handle it
    } else if (activeTab === 'albums') {
      // Don't fetch albums here - let the debounced effect handle it
    } else if (activeTab === 'playlists') {
      // Don't fetch playlists here - let the debounced effect handle it
    }
  }, [activeTab]);

  // Debounce filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsersFilters(usersFilters);
    }, 300);
    return () => clearTimeout(timer);
  }, [usersFilters]);

  // Trigger fetch when debounced search OR filters change (combined to prevent duplicate fetches)
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(1, debouncedUsersSearch, debouncedUsersFilters);
    }
  }, [debouncedUsersSearch, debouncedUsersFilters, activeTab]);

  useEffect(() => {
    if (activeTab === 'songs') {
      fetchSongs(1, debouncedSongsSearch);
    }
  }, [debouncedSongsSearch, activeTab]);

  useEffect(() => {
    if (activeTab === 'albums') {
      fetchAlbums(1, debouncedAlbumsSearch);
    }
  }, [debouncedAlbumsSearch, activeTab]);

  useEffect(() => {
    if (activeTab === 'playlists') {
      fetchPlaylists(1, debouncedPlaylistsSearch);
    }
  }, [debouncedPlaylistsSearch, activeTab]);

  if (user?.userType !== 'Administrator') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-red-700">Administrator access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-2xl mb-8 p-8">
          <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-xl p-6 text-white text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">CoogMusic Admin Dashboard</h1>
            <p className="text-red-100">University of Houston Music Platform Administration</p>
          </div>
        
          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-red-700 text-white shadow-lg' 
                  : 'bg-white border border-red-700 text-red-700 hover:bg-red-50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === 'users' 
                  ? 'bg-red-700 text-white shadow-lg' 
                  : 'bg-white border border-red-700 text-red-700 hover:bg-red-50'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('songs')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === 'songs' 
                  ? 'bg-red-700 text-white shadow-lg' 
                  : 'bg-white border border-red-700 text-red-700 hover:bg-red-50'
              }`}
            >
              Songs
            </button>
            <button
              onClick={() => setActiveTab('albums')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === 'albums' 
                  ? 'bg-red-700 text-white shadow-lg' 
                  : 'bg-white border border-red-700 text-red-700 hover:bg-red-50'
              }`}
            >
              Albums
            </button>
            <button
              onClick={() => setActiveTab('playlists')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === 'playlists' 
                  ? 'bg-red-700 text-white shadow-lg' 
                  : 'bg-white border border-red-700 text-red-700 hover:bg-red-50'
              }`}
            >
              Playlists
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-700"></div>
              <p className="text-red-700 mt-2">Loading...</p>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-red-200 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Users</h3>
                    <p className="text-3xl font-bold text-red-700">{stats.totalUsers}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-red-200 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Active Users</h3>
                    <p className="text-3xl font-bold text-red-700">{stats.activeUsers}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-red-200 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Songs</h3>
                    <p className="text-3xl font-bold text-red-700">{stats.totalSongs}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-red-200 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Albums</h3>
                    <p className="text-3xl font-bold text-red-700">{stats.totalAlbums}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-red-200 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Playlists</h3>
                    <p className="text-3xl font-bold text-red-700">{stats.totalPlaylists}</p>
                  </div>
                  <div className="bg-pink-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-xl shadow-lg border border-red-200 overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-800 px-6 py-4">
                <h2 className="text-xl font-bold text-white">User Management</h2>
                <p className="text-red-100">Manage all platform users and their permissions</p>
              </div>
              
              {/* Filters Section */}
              <div className="border-b border-red-200">
                <button
                  onClick={() => setUsersFiltersOpen(!usersFiltersOpen)}
                  className="w-full px-6 py-4 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span className="font-semibold text-red-900">Filters</span>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-red-700 transition-transform ${usersFiltersOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {usersFiltersOpen && (
                  <div className="px-6 py-6 bg-gray-50 border-t border-red-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {/* Date of Birth (up to) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth (up to)</label>
                        <input
                          type="date"
                          value={usersFilters.dateOfBirthTo}
                          onChange={(e) => handleFilterChange('dateOfBirthTo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>

                      {/* Date Joined (up to) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date Joined (up to)</label>
                        <input
                          type="date"
                          value={usersFilters.dateJoinedTo}
                          onChange={(e) => handleFilterChange('dateJoinedTo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>

                      {/* Country Dropdown */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <select
                          value={usersFilters.country}
                          onChange={(e) => handleFilterChange('country', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <option value="">All Countries</option>
                          {filterOptions.countries.map((country) => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>

                      {/* City Dropdown */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <select
                          value={usersFilters.city}
                          onChange={(e) => handleFilterChange('city', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <option value="">All Cities</option>
                          {filterOptions.cities.map((city) => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>

                      {/* User Type Dropdown */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                        <select
                          value={usersFilters.userType}
                          onChange={(e) => handleFilterChange('userType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <option value="">All Types</option>
                          <option value="Listener">Listener</option>
                          <option value="Artist">Artist</option>
                          <option value="Administrator">Administrator</option>
                          <option value="Analyst">Analyst</option>
                        </select>
                      </div>

                      {/* Account Status Dropdown */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                        <select
                          value={usersFilters.accountStatus}
                          onChange={(e) => handleFilterChange('accountStatus', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <option value="">All Statuses</option>
                          <option value="Active">Active</option>
                          <option value="Suspended">Suspended</option>
                          <option value="Banned">Banned</option>
                        </select>
                      </div>

                      {/* Created At (up to) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Created At (up to)</label>
                        <input
                          type="date"
                          value={usersFilters.createdAtTo}
                          onChange={(e) => handleFilterChange('createdAtTo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>

                      {/* Updated At (up to) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Updated At (up to)</label>
                        <input
                          type="date"
                          value={usersFilters.updatedAtTo}
                          onChange={(e) => handleFilterChange('updatedAtTo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    {/* Clear Filters Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={handleClearFilters}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <SearchInput
                value={usersSearch}
                onSearch={handleUsersSearch}
                placeholder="Search users by name, username, or email..."
              />
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-red-50 border-b border-red-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Username</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date of Birth</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date Joined</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Country</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">City</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Created At</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Updated At</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Last Login</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {users.map((user) => (
                      <tr key={user.UserID} className="hover:bg-red-25 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">{user.UserID}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.Username}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{user.FirstName} {user.LastName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.Email}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.UserType === 'Administrator' ? 'bg-red-100 text-red-800' :
                            user.UserType === 'Artist' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.UserType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.AccountStatus === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.AccountStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.DateOfBirth ? new Date(user.DateOfBirth).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(user.DateJoined).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.Country}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.City || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.CreatedAt ? new Date(user.CreatedAt).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.UpdatedAt ? new Date(user.UpdatedAt).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.LastLogin ? new Date(user.LastLogin).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {user.AccountStatus === 'Active' && user.UserType !== 'Administrator' && (
                            <button
                              onClick={() => banUser(user.UserID)}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                            >
                              Ban User
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                pagination={usersPagination}
                onPageChange={handleUsersPageChange}
              />
            </div>
          )}

          {/* Songs Tab */}
          {activeTab === 'songs' && (
            <div className="bg-white rounded-xl shadow-lg border border-red-200 overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-800 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Song Management</h2>
                <p className="text-red-100">Monitor and manage all songs on the platform</p>
              </div>
              <SearchInput
                value={songsSearch}
                onSearch={handleSongsSearch}
                placeholder="Search songs by title, artist, or album..."
              />
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-red-50 border-b border-red-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Title</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Artist</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Album</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Genre</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Likes</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Plays</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {songs.map((song) => (
                      <tr key={song.SongID} className="hover:bg-red-25 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">{song.SongID}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{song.Title}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{song.ArtistName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{song.AlbumTitle || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{song.GenreName || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                            {song.LikeCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            {song.PlayCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => deleteSong(song.SongID)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                pagination={songsPagination}
                onPageChange={handleSongsPageChange}
              />
            </div>
          )}

          {/* Albums Tab */}
          {activeTab === 'albums' && (
            <div className="bg-white rounded-xl shadow-lg border border-red-200 overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-800 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Album Management</h2>
                <p className="text-red-100">Monitor and manage all albums on the platform</p>
              </div>
              <SearchInput
                value={albumsSearch}
                onSearch={handleAlbumsSearch}
                placeholder="Search albums by title or artist..."
              />
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-red-50 border-b border-red-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Title</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Artist</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Songs</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Likes</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Release Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {albums.map((album) => (
                      <tr key={album.AlbumID} className="hover:bg-red-25 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">{album.AlbumID}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{album.Title}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{album.ArtistName}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {album.SongCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                            {album.LikeCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(album.ReleaseDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => deleteAlbum(album.AlbumID)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                pagination={albumsPagination}
                onPageChange={handleAlbumsPageChange}
              />
            </div>
          )}

          {/* Playlists Tab */}
          {activeTab === 'playlists' && (
            <div className="bg-white rounded-xl shadow-lg border border-red-200 overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-800 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Playlist Management</h2>
                <p className="text-red-100">Monitor and manage all playlists on the platform</p>
              </div>
              <SearchInput
                value={playlistsSearch}
                onSearch={handlePlaylistsSearch}
                placeholder="Search playlists by name or creator..."
              />
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-red-50 border-b border-red-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Creator</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Songs</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Likes</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Public</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {playlists.map((playlist) => (
                      <tr key={playlist.PlaylistID} className="hover:bg-red-25 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">{playlist.PlaylistID}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{playlist.PlaylistName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{playlist.CreatorName}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {playlist.SongCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                            {playlist.LikeCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            playlist.IsPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {playlist.IsPublic ? 'Public' : 'Private'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => deletePlaylist(playlist.PlaylistID)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                pagination={playlistsPagination}
                onPageChange={handlePlaylistsPageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;