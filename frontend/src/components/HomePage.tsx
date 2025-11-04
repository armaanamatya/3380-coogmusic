import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { ArtistCard, SongCard, AlbumCard, PlaylistCard } from './cards'
import { GenreCard } from './cards/GenreCard'
import { PlaylistExpanded } from './PlaylistExpanded'
import { AlbumExpanded } from './AlbumExpanded'
import { MyPlaylistsSection } from './MyPlaylistsSection'
import { CreatePlaylistModal } from './CreatePlaylistModal'
import { AddToPlaylistModal } from './AddToPlaylistModal'
import { genreApi, artistApi, songApi, albumApi, playlistApi, userApi, getFileUrl } from '../services/api'
import MusicUploadForm from './MusicUploadForm'
import MusicLibrary from './MusicLibrary'
import MusicEditForm from './MusicEditForm'
import AlbumManager from './AlbumManager'
import Settings from './Settings'


interface Song {
  SongID: number;
  SongName: string;
  ArtistID: number;
  ArtistFirstName: string;
  ArtistLastName: string;
  AlbumID?: number;
  AlbumName?: string;
  GenreID?: number;
  GenreName?: string;
  Duration: number;
  ListenCount: number;
  FilePath: string;
  FileSize: number;
  ReleaseDate: string;
  CreatedAt: string;
}

interface GenreWithListens {
  GenreID: number
  GenreName: string
  Description?: string
  CreatedAt: string
  UpdatedAt: string
  songCount: number
  totalListens: number
}

interface TopArtist {
  ArtistID: number
  FirstName: string
  LastName: string
  Username: string
  ProfilePicture?: string
  ArtistBio?: string
  VerifiedStatus: number
  followerCount: number
}

interface TopSong {
  SongID: number
  SongName: string
  ListenCount: number
  Duration: number
  ReleaseDate: string
  FilePath?: string
  FileSize?: number
  ArtistFirstName: string
  ArtistLastName: string
  ArtistUsername: string
  AlbumName?: string
  GenreName?: string
}

interface TopAlbum {
  AlbumID: number
  AlbumName: string
  ReleaseDate: string
  AlbumCover?: string
  Description?: string
  likeCount: number
  ArtistFirstName: string
  ArtistLastName: string
  ArtistUsername: string
  songCount: number
}

interface TopPlaylist {
  PlaylistID: number
  PlaylistName: string
  Description?: string
  IsPublic: number
  CreatedAt: string
  likeCount: number
  CreatorFirstName: string
  CreatorLastName: string
  CreatorUsername: string
  songCount: number
}

type MusicSubTab = 'library' | 'upload' | 'albums' | 'edit';

function HomePage() {
  const { user, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('home')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
  
  // Music management state
  const [musicSubTab, setMusicSubTab] = useState<MusicSubTab>('library')
  const [editingSong, setEditingSong] = useState<Song | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Genres state
  const [genres, setGenres] = useState<GenreWithListens[]>([])
  const [genresLoading, setGenresLoading] = useState(true)
  
  // Top artists state
  const [topArtists, setTopArtists] = useState<TopArtist[]>([])
  const [artistsLoading, setArtistsLoading] = useState(true)
  
  // Followed artists state
  const [followedArtists, setFollowedArtists] = useState<any[]>([])
  const [followedLoading, setFollowedLoading] = useState(false)
  
  // Top songs state
  const [topSongs, setTopSongs] = useState<TopSong[]>([])
  const [songsLoading, setSongsLoading] = useState(true)
  
  // Top albums state
  const [topAlbums, setTopAlbums] = useState<TopAlbum[]>([])
  const [albumsLoading, setAlbumsLoading] = useState(true)
  
  // Top playlists state
  const [topPlaylists, setTopPlaylists] = useState<TopPlaylist[]>([])
  const [playlistsLoading, setPlaylistsLoading] = useState(true)
  
  // Expanded playlist state
  const [expandedPlaylist, setExpandedPlaylist] = useState<{
    id: number;
    name: string;
  } | null>(null)

  // Expanded album state
  const [expandedAlbum, setExpandedAlbum] = useState<{
    id: number;
    name: string;
  } | null>(null)

  // Playlist modal state
  const [isCreatePlaylistModalOpen, setIsCreatePlaylistModalOpen] = useState(false)
  const [isAddToPlaylistModalOpen, setIsAddToPlaylistModalOpen] = useState(false)
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState<{
    id: number;
    title: string;
  } | null>(null)
  const [playlistRefreshTrigger, setPlaylistRefreshTrigger] = useState(0)

  // Music management handlers
  const handleEditSong = (song: Song) => {
    setEditingSong(song);
    setMusicSubTab('edit');
  };

  const handleUploadSuccess = () => {
    setMusicSubTab('library');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUpdateSuccess = () => {
    setEditingSong(null);
    setMusicSubTab('library');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteSong = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancelEdit = () => {
    setEditingSong(null);
    setMusicSubTab('library');
  };

  // Playlist handlers
  const handleCreatePlaylist = () => {
    setIsCreatePlaylistModalOpen(true)
  }

  const handlePlaylistCreated = () => {
    setPlaylistRefreshTrigger(prev => prev + 1)
  }

  const handleAddToPlaylist = (songId: number, songTitle: string) => {
    setSelectedSongForPlaylist({ id: songId, title: songTitle })
    setIsAddToPlaylistModalOpen(true)
  }

  const handleCloseAddToPlaylistModal = () => {
    setSelectedSongForPlaylist(null)
    setIsAddToPlaylistModalOpen(false)
  }

  // Fetch top 10 genres with listen counts
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setGenresLoading(true)
        const response = await genreApi.getAllWithListens()
        
        if (!response.ok) {
          throw new Error('Failed to fetch genres')
        }
        
        const data = await response.json()
        // Ensure data.genres is an array before using slice
        const genresArray = Array.isArray(data.genres) ? data.genres : (Array.isArray(data) ? data : [])
        // Limit to top 10 genres
        setGenres(genresArray.slice(0, 10))
      } catch (error) {
        console.error('Error fetching genres:', error)
        setGenres([])
      } finally {
        setGenresLoading(false)
      }
    }

    fetchGenres()
  }, [])

  // Function to fetch followed artists
  const fetchFollowedArtists = useCallback(async () => {
    if (!user?.userId) {
      return
    }
    
    try {
      setFollowedLoading(true)
      const response = await userApi.getFollowing(user.userId, { limit: 20 })
      
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to fetch followed artists: ${errorData}`)
      }
      
      const data = await response.json()
      setFollowedArtists(data.following || [])
    } catch (error) {
      setFollowedArtists([])
    } finally {
      setFollowedLoading(false)
    }
  }, [user?.userId])

  // Fetch top 10 artists by followers
  useEffect(() => {
    const fetchTopArtists = async () => {
      try {
        setArtistsLoading(true)
        const response = await artistApi.getTop()
        
        if (!response.ok) {
          throw new Error('Failed to fetch top artists')
        }
        
        const data = await response.json()
        // Ensure data.artists is an array
        const artistsArray = Array.isArray(data.artists) ? data.artists : (Array.isArray(data) ? data : [])
        setTopArtists(artistsArray)
      } catch (error) {
        console.error('Error fetching top artists:', error)
        setTopArtists([])
      } finally {
        setArtistsLoading(false)
      }
    }

    fetchTopArtists()
    fetchFollowedArtists()
  }, [user?.userId, fetchFollowedArtists])

  // Function to refresh followed artists (called after follow/unfollow)
  const refreshFollowedArtists = () => {
    fetchFollowedArtists()
  }

  // Fetch top 10 songs by listen count
  useEffect(() => {
    const fetchTopSongs = async () => {
      try {
        setSongsLoading(true)
        const response = await songApi.getTop()
        
        if (!response.ok) {
          throw new Error('Failed to fetch top songs')
        }
        
        const data = await response.json()
        // Ensure data.songs is an array
        const songsArray = Array.isArray(data.songs) ? data.songs : (Array.isArray(data) ? data : [])
        setTopSongs(songsArray)
      } catch (error) {
        console.error('Error fetching top songs:', error)
        setTopSongs([])
      } finally {
        setSongsLoading(false)
      }
    }

    fetchTopSongs()
  }, [])

  // Fetch top 10 albums by like count
  useEffect(() => {
    const fetchTopAlbums = async () => {
      try {
        setAlbumsLoading(true)
        const response = await albumApi.getTop()
        
        if (!response.ok) {
          throw new Error('Failed to fetch top albums')
        }
        
        const data = await response.json()
        // Ensure data.albums is an array
        const albumsArray = Array.isArray(data.albums) ? data.albums : (Array.isArray(data) ? data : [])
        setTopAlbums(albumsArray)
      } catch (error) {
        console.error('Error fetching top albums:', error)
        setTopAlbums([])
      } finally {
        setAlbumsLoading(false)
      }
    }

    fetchTopAlbums()
  }, [])

  // Fetch top 10 playlists by like count (only public playlists)
  useEffect(() => {
    const fetchTopPlaylists = async () => {
      try {
        setPlaylistsLoading(true)
        const response = await playlistApi.getTop()
        
        if (!response.ok) {
          throw new Error('Failed to fetch top playlists')
        }
        
        const data = await response.json()
        // Ensure data.playlists is an array
        const playlistsArray = Array.isArray(data.playlists) ? data.playlists : (Array.isArray(data) ? data : [])
        setTopPlaylists(playlistsArray)
      } catch (error) {
        console.error('Error fetching top playlists:', error)
        setTopPlaylists([])
      } finally {
        setPlaylistsLoading(false)
      }
    }

    fetchTopPlaylists()
  }, [])

  // Helper function to get genre image URL
  const getGenreImageUrl = (genreName: string) => {
    const genreImageMap: { [key: string]: string } = {
      'Pop': 'pop.png',
      'Rock': 'rock.jpg',
      'Hip-Hop': 'hiphop.png',
      'Electronic': 'electronic.avif',
      'Dance': 'dance.jpg',
      'House': 'house.jpg',
      'Dubstep': 'dubstep.jpg',
      'Jazz': 'jazz.jpg',
      'Blues': 'blues.jpg',
      'Classical': 'classical.jpg',
      'Country': 'country.jpg',
      'R&B/Soul': 'r&b.jpg',
      'Alternative': 'alternative.png',
      'Folk': 'folk.jpg',
      'Ambient': 'ambient.jpg',
      'Metal': 'metal.jpg',
      'Reggae': 'reggae.jpg'
    }

    const imageName = genreImageMap[genreName] || 'default.jpg'
    return getFileUrl(`genre-imgs/${imageName}`)
  }
  
  // Helper function to get artist image URL
  const getArtistImageUrl = () => {
    return getFileUrl('profile-pictures/default.jpg')
  }

  // Helper function to format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Helper function to get album cover URL
  const getAlbumCoverUrl = () => {
    return getFileUrl('profile-pictures/default.jpg')
  }





  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarCollapsed ? 'w-24' : 'w-64'} bg-red-700 shadow-lg transition-all duration-300 ease-in-out`}
        onMouseEnter={() => setIsSidebarCollapsed(false)}
        onMouseLeave={() => setIsSidebarCollapsed(true)}
      >
        <div className="p-6">
          {/* User Profile Section */}
          <div className="flex flex-col items-center space-y-4">
            <img
              src="/api/placeholder/120/120"
              alt="User profile"
              className={`${isSidebarCollapsed ? 'w-16 h-16' : 'w-24 h-24'} rounded-full border-4 border-white shadow-md transition-all duration-300`}
            />
            {!isSidebarCollapsed && (
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white">
                  {user ? `${user.firstName || user.username}` : 'User'}
                </h2>
                <p className="text-sm text-white/80">
                  {user?.userType || 'Member'}
                </p>
              </div>
            )}
          </div>
          
          {/* Navigation Menu */}
          <nav className="mt-8">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveTab('home')}
                  className={`flex items-center w-full ${isSidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'} rounded-lg transition-colors ${
                    activeTab === 'home'
                      ? 'bg-white text-red-700'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <svg className={`w-7 h-7 ${!isSidebarCollapsed ? 'mr-3' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  {!isSidebarCollapsed && 'Home'}
                </button>
              </li>
              {user?.userType?.toLowerCase() === 'artist' && (
                <li>
                  <button
                    onClick={() => setActiveTab('my-music')}
                    className={`flex items-center w-full ${isSidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'} rounded-lg transition-colors ${
                      activeTab === 'my-music'
                        ? 'bg-white text-red-700'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <svg className={`w-7 h-7 ${!isSidebarCollapsed ? 'mr-3' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    {!isSidebarCollapsed && 'My Music'}
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={() => setActiveTab('library')}
                  className={`flex items-center w-full ${isSidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'} rounded-lg transition-colors ${
                    activeTab === 'library'
                      ? 'bg-white text-red-700'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                   <svg className={`w-7 h-7 ${!isSidebarCollapsed ? 'mr-3' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                   </svg>
                  {!isSidebarCollapsed && 'Your Library'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center w-full ${isSidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'} rounded-lg transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-white text-red-700'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                   <svg className={`w-7 h-7 ${!isSidebarCollapsed ? 'mr-3' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                   </svg>
                  {!isSidebarCollapsed && 'Settings'}
                </button>
              </li>
            </ul>
            
            {/* Sign Out Button */}
            <div className="mt-8 pt-8 border-t border-white/20">
              <button
                onClick={logout}
                className={`flex items-center w-full ${isSidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'} text-white hover:bg-white/10 rounded-lg transition-colors`}
              >
                 <svg className={`w-7 h-7 ${!isSidebarCollapsed ? 'mr-3' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                 </svg>
                {!isSidebarCollapsed && 'Sign Out'}
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <input
              type="text"
              placeholder="Search for songs, artists, playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200"
            />
            <svg
              className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Content Rows */}
        <div className="space-y-8">
          {activeTab === 'home' && (
            <>
              {/* Top Artists Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-red-700 mb-4">Top Artists</h2>
                {artistsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-gray-600">Loading top artists...</div>
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {Array.isArray(topArtists) && topArtists.map((artist) => (
                      <div key={artist.ArtistID} className="flex-shrink-0">
                        <ArtistCard
                          id={artist.ArtistID.toString()}
                          name={`${artist.FirstName} ${artist.LastName}`}
                          imageUrl={getArtistImageUrl()}
                          onFollowChange={refreshFollowedArtists}
                        />
                        <div className="text-center mt-2">
                          <p className="text-xs text-gray-600">
                            {artist.followerCount} followers
                          </p>
                          {artist.VerifiedStatus && (
                            <span className="inline-block text-blue-500 text-xs">✓ Verified</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Songs Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-red-700 mb-4">Top Songs</h2>
                {songsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-gray-600">Loading top songs...</div>
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {Array.isArray(topSongs) && topSongs.map((song) => (
                      <div key={song.SongID} className="flex-shrink-0">
                        <SongCard
                          id={song.SongID.toString()}
                          title={song.SongName}
                          artist={`${song.ArtistFirstName} ${song.ArtistLastName}`}
                          imageUrl={getFileUrl('profile-pictures/default.jpg')}
                          onAddToPlaylist={handleAddToPlaylist}
                          listenCount={song.ListenCount}
                        />
                        <div className="text-center mt-2">
                          <p className="text-xs text-gray-600">
                            {song.ListenCount?.toLocaleString() || 0} listens
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDuration(song.Duration)} • {song.GenreName || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Albums Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-red-700 mb-4">Top Albums</h2>
                {albumsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-gray-600">Loading top albums...</div>
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {Array.isArray(topAlbums) && topAlbums.map((album) => (
                      <div key={album.AlbumID} className="flex-shrink-0">
                        <AlbumCard
                          id={album.AlbumID.toString()}
                          title={album.AlbumName}
                          artist={`${album.ArtistFirstName} ${album.ArtistLastName}`}
                          imageUrl={getAlbumCoverUrl()}
                          onClick={() => setExpandedAlbum({
                            id: album.AlbumID,
                            name: album.AlbumName
                          })}
                        />
                        <div className="text-center mt-2">
                          <p className="text-xs text-gray-600">
                            {album.likeCount} likes
                          </p>
                          <p className="text-xs text-gray-500">
                            {album.songCount} songs • {new Date(album.ReleaseDate).getFullYear()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Playlists Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-red-700 mb-4">Top Playlists</h2>
                {playlistsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-gray-600">Loading top playlists...</div>
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {Array.isArray(topPlaylists) && topPlaylists.map((playlist) => (
                      <div key={playlist.PlaylistID} className="flex-shrink-0">
                        <PlaylistCard
                          id={playlist.PlaylistID.toString()}
                          title={playlist.PlaylistName}
                          imageUrl={getFileUrl('profile-pictures/default.jpg')}
                          onClick={() => setExpandedPlaylist({
                            id: playlist.PlaylistID,
                            name: playlist.PlaylistName
                          })}
                        />
                        <div className="text-center mt-2">
                          <p className="text-xs text-gray-600">
                            {playlist.likeCount} likes
                          </p>
                          <p className="text-xs text-gray-500">
                            by @{playlist.CreatorUsername}
                          </p>
                          <p className="text-xs text-gray-500">
                            {playlist.songCount} songs
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Genres Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-red-700 mb-4">Genres</h2>
                {genresLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-gray-600">Loading genres...</div>
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {Array.isArray(genres) && genres.map((genre) => (
                      <GenreCard
                        key={genre.GenreID}
                        id={genre.GenreID.toString()}
                        name={genre.GenreName}
                        imageUrl={getGenreImageUrl(genre.GenreName)}
                        listenCount={genre.totalListens}
                        onClick={() => console.log(`Clicked on genre: ${genre.GenreName}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>

            
          )}

          {activeTab === 'library' && (
            <>
              {/* Your Followed Artists Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-red-700 mb-4">Your Followed Artists</h2>
                {followedLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-gray-600">Loading followed artists...</div>
                  </div>
                ) : followedArtists.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">You haven't followed any artists yet.</p>
                    <p className="text-sm text-gray-500">Follow artists to see them here!</p>
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {followedArtists.map((artist) => (
                      <div key={artist.ArtistID} className="flex-shrink-0">
                        <ArtistCard
                          id={artist.ArtistID.toString()}
                          name={`${artist.FirstName} ${artist.LastName}`}
                          imageUrl={artist.ProfilePicture ? getFileUrl(artist.ProfilePicture) : getFileUrl('profile-pictures/default.jpg')}
                          showFollowButton={false}
                        />
                        <div className="text-center mt-2">
                          <p className="text-xs text-gray-600">
                            @{artist.Username}
                          </p>
                          {artist.VerifiedStatus && (
                            <span className="inline-block text-blue-500 text-xs">✓ Verified</span>
                          )}
                          <p className="text-xs text-gray-500">
                            Followed {new Date(artist.FollowedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Your Library - My Playlists Section */}
              <MyPlaylistsSection
                onCreatePlaylist={handleCreatePlaylist}
                onPlaylistClick={setExpandedPlaylist}
                key={playlistRefreshTrigger}
              />

            </>
          )}

          {activeTab === 'my-music' && user?.userType?.toLowerCase() === 'artist' && (
            <div className="space-y-6">
              {/* Music Management Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-red-700 mb-2">My Music</h2>
                <p className="text-gray-600">Upload, edit, and manage your music library</p>
              </div>

              {/* Sub-navigation for Music Management */}
              {musicSubTab !== 'edit' && (
                <div className="border-b border-gray-200 mb-6">
                  <nav className="flex space-x-8">
                    <button
                      onClick={() => setMusicSubTab('library')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        musicSubTab === 'library'
                          ? 'border-red-500 text-red-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span>🎵</span>
                      <span>Music Library</span>
                    </button>
                    
                    <button
                      onClick={() => setMusicSubTab('upload')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        musicSubTab === 'upload'
                          ? 'border-red-500 text-red-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span>⬆️</span>
                      <span>Upload Music</span>
                    </button>
                    
                    <button
                      onClick={() => setMusicSubTab('albums')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        musicSubTab === 'albums'
                          ? 'border-red-500 text-red-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span>💿</span>
                      <span>Manage Albums</span>
                    </button>
                  </nav>
                </div>
              )}

              {/* Back to Library button for Edit mode */}
              {musicSubTab === 'edit' && editingSong && (
                <div className="mb-6">
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to Music Library</span>
                  </button>
                </div>
              )}

              {/* Content based on active sub-tab */}
              <div className="bg-white rounded-lg shadow-sm">
                {musicSubTab === 'library' && (
                  <MusicLibrary
                    onEditSong={handleEditSong}
                    onDeleteSong={handleDeleteSong}
                    refreshTrigger={refreshTrigger}
                  />
                )}

                {musicSubTab === 'upload' && (
                  <div className="p-6">
                    <MusicUploadForm
                      onUploadSuccess={handleUploadSuccess}
                      onCancel={() => setMusicSubTab('library')}
                    />
                  </div>
                )}

                {musicSubTab === 'albums' && (
                  <AlbumManager refreshTrigger={refreshTrigger} />
                )}

                {musicSubTab === 'edit' && editingSong && (
                  <div className="p-6">
                    <MusicEditForm
                      song={editingSong}
                      onUpdateSuccess={handleUpdateSuccess}
                      onCancel={handleCancelEdit}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <Settings />
          )}
        </div>
      </main>

      {/* Expanded Playlist Modal */}
      {expandedPlaylist && (
        <PlaylistExpanded
          playlistId={expandedPlaylist.id}
          playlistName={expandedPlaylist.name}
          onClose={() => setExpandedPlaylist(null)}
        />
      )}

      {/* Expanded Album Modal */}
      {expandedAlbum && (
        <AlbumExpanded
          albumId={expandedAlbum.id}
          albumName={expandedAlbum.name}
          onClose={() => setExpandedAlbum(null)}
        />
      )}

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isCreatePlaylistModalOpen}
        onClose={() => setIsCreatePlaylistModalOpen(false)}
        onPlaylistCreated={handlePlaylistCreated}
      />

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={isAddToPlaylistModalOpen}
        onClose={handleCloseAddToPlaylistModal}
        songId={selectedSongForPlaylist?.id || null}
        songTitle={selectedSongForPlaylist?.title}
      />
    </div>
  )
}

export default HomePage