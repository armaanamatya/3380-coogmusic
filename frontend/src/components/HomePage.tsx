import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { ArtistCard, SongCard, AlbumCard, PlaylistCard } from './cards'
import MusicUploadForm from './MusicUploadForm'
import MusicLibrary from './MusicLibrary'
import MusicEditForm from './MusicEditForm'
import AlbumManager from './AlbumManager'


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

  // Music management handlers
  const handleEditSong = (song: Song) => {
    setEditingSong(song);
    setMusicSubTab('edit');
  };

  const handleUploadSuccess = (songId: number) => {
    setMusicSubTab('library');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUpdateSuccess = (songId: number) => {
    setEditingSong(null);
    setMusicSubTab('library');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteSong = (songId: number) => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancelEdit = () => {
    setEditingSong(null);
    setMusicSubTab('library');
  };
  
  // Separate data by type - replace with actual API calls later
  const artists = [
    { id: '2', name: 'The Weeknd', imageUrl: '/api/placeholder/200/200' },
    { id: '6', name: 'Taylor Swift', imageUrl: '/api/placeholder/200/200' },
  ]

  const songs = [
    { id: '3', title: 'Blinding Lights', artist: 'The Weeknd', imageUrl: '/api/placeholder/200/200' },
    { id: '7', title: 'Anti-Hero', artist: 'Taylor Swift', imageUrl: '/api/placeholder/200/200' },
  ]

  const albums = [
    { id: '4', title: 'After Hours', artist: 'The Weeknd', imageUrl: '/api/placeholder/200/200' },
    { id: '8', title: 'Midnights', artist: 'Taylor Swift', imageUrl: '/api/placeholder/200/200' },
  ]

  const playlists = [
    { id: '1', title: 'Summer Vibes', imageUrl: '/api/placeholder/200/200' },
    { id: '5', title: 'Chill Beats', imageUrl: '/api/placeholder/200/200' },
  ]


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
              {/* Artists Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-red-700 mb-4">Artists</h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {artists.map((artist) => (
                    <ArtistCard
                      key={artist.id}
                      id={artist.id}
                      name={artist.name}
                      imageUrl={artist.imageUrl}
                    />
                  ))}
                </div>
              </div>

              {/* Songs Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-red-700 mb-4">Songs</h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {songs.map((song) => (
                    <SongCard
                      key={song.id}
                      id={song.id}
                      title={song.title}
                      artist={song.artist}
                      imageUrl={song.imageUrl}
                    />
                  ))}
                </div>
              </div>

              {/* Albums Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-red-700 mb-4">Albums</h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {albums.map((album) => (
                    <AlbumCard
                      key={album.id}
                      id={album.id}
                      title={album.title}
                      artist={album.artist}
                      imageUrl={album.imageUrl}
                    />
                  ))}
                </div>
              </div>

              {/* Playlists Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-red-700 mb-4">Playlists</h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {playlists.map((playlist) => (
                    <PlaylistCard
                      key={playlist.id}
                      id={playlist.id}
                      title={playlist.title}
                      imageUrl={playlist.imageUrl}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'library' && (
            <>
              {/* Your Library - Playlists Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-red-700 mb-4">Your Playlists</h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {playlists.map((playlist) => (
                    <PlaylistCard
                      key={playlist.id}
                      id={playlist.id}
                      title={playlist.title}
                      imageUrl={playlist.imageUrl}
                    />
                  ))}
                </div>
              </div>

              {/* Your Library - Artists Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-red-700 mb-4">Your Artists</h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {artists.map((artist) => (
                    <ArtistCard
                      key={artist.id}
                      id={artist.id}
                      name={artist.name}
                      imageUrl={artist.imageUrl}
                    />
                  ))}
                </div>
              </div>
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
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-red-700 mb-4">Settings</h2>
              <p className="text-gray-600">Manage your account settings and preferences.</p>
              {/* Add settings content here */}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default HomePage