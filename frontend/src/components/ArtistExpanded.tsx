import React, { useState, useEffect } from 'react'
import { artistApi, followApi, getFileUrl } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { SongCard } from './cards/SongCard'
import { AlbumCard } from './cards/AlbumCard'

interface Artist {
  ArtistID: number
  FirstName: string
  LastName: string
  Username: string
  ProfilePicture?: string
  ArtistBio?: string
  VerifiedStatus: number
  DateVerified?: string
}

interface ArtistStats {
  followerCount: number
  albumCount: number
  songCount: number
  totalListens: number
}

interface Album {
  AlbumID: number
  AlbumName: string
  ReleaseDate: string
  AlbumCover?: string
  Description?: string
}

interface Song {
  SongID: number
  SongName: string
  Duration: number
  ListenCount: number
  FilePath?: string
  GenreName?: string
  AlbumName?: string
}

interface ArtistExpandedProps {
  artistId: number
  artistName: string
  onClose: () => void
}

type TabType = 'overview' | 'albums' | 'songs'

export const ArtistExpanded: React.FC<ArtistExpandedProps> = ({
  artistId,
  onClose
}) => {
  const { user } = useAuth()
  const [artist, setArtist] = useState<Artist | null>(null)
  const [stats, setStats] = useState<ArtistStats | null>(null)
  const [albums, setAlbums] = useState<Album[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    fetchArtistData()
    if (user) {
      checkFollowStatus()
    }
  }, [artistId, user])

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (target.closest('.artist-modal-content')) {
        return // Click is inside modal content, don't close
      }
      onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  const fetchArtistData = async () => {
    try {
      setLoading(true)
      
      // Fetch artist details and stats in parallel
      const [artistResponse, statsResponse] = await Promise.all([
        artistApi.getById(artistId),
        artistApi.getStats(artistId)
      ])

      if (!artistResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch artist data')
      }

      const artistData = await artistResponse.json()
      const statsData = await statsResponse.json()

      setArtist(artistData.artist)
      setStats(statsData.stats)

      // Fetch albums and songs
      const [albumsResponse, songsResponse] = await Promise.all([
        artistApi.getAlbums(artistId),
        artistApi.getSongs(artistId)
      ])

      if (albumsResponse.ok) {
        const albumsData = await albumsResponse.json()
        setAlbums(Array.isArray(albumsData.albums) ? albumsData.albums : [])
      }

      if (songsResponse.ok) {
        const songsData = await songsResponse.json()
        setSongs(Array.isArray(songsData.songs) ? songsData.songs : [])
      }

    } catch (err) {
      setError('Failed to load artist details')
      console.error('Error fetching artist data:', err)
    } finally {
      setLoading(false)
    }
  }

  const checkFollowStatus = async () => {
    if (!user) return
    
    try {
      const response = await followApi.checkFollowStatus(user.userId, artistId)
      const data = await response.json()
      setIsFollowing(data.isFollowing)
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }

  const handleFollowClick = async () => {
    if (!user || followLoading) return
    
    setFollowLoading(true)
    try {
      if (isFollowing) {
        const response = await followApi.unfollowArtist(user.userId, artistId)
        if (response.ok) {
          setIsFollowing(false)
          setStats(prev => prev ? { ...prev, followerCount: prev.followerCount - 1 } : null)
        }
      } else {
        const response = await followApi.followArtist(user.userId, artistId)
        if (response.ok) {
          setIsFollowing(true)
          setStats(prev => prev ? { ...prev, followerCount: prev.followerCount + 1 } : null)
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setFollowLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Loading artist details...</p>
        </div>
      </div>
    )
  }

  if (error || !artist || !stats) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-4">Error</h3>
          <p className="text-gray-600 mb-4">{error || 'Artist not found'}</p>
          <button
            onClick={onClose}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="artist-modal-content bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-red-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-6">
              {/* Artist Profile Picture */}
              <img
                src={artist.ProfilePicture ? getFileUrl(artist.ProfilePicture) : getFileUrl('profile-pictures/default.jpg')}
                alt={`${artist.FirstName} ${artist.LastName}`}
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
              
              {/* Artist Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-3xl font-bold">{artist.FirstName} {artist.LastName}</h2>
                  {artist.VerifiedStatus === 1 && (
                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-red-100 mb-4">@{artist.Username}</p>
                
                {/* Stats */}
                <div className="flex space-x-6 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-xl">{formatNumber(stats.followerCount)}</div>
                    <div className="text-red-200">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-xl">{stats.albumCount}</div>
                    <div className="text-red-200">Albums</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-xl">{stats.songCount}</div>
                    <div className="text-red-200">Songs</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-xl">{formatNumber(stats.totalListens)}</div>
                    <div className="text-red-200">Total Listens</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Follow Button */}
              {user && (
                <button
                  onClick={handleFollowClick}
                  disabled={followLoading}
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${
                    isFollowing
                      ? 'bg-white text-red-600 hover:bg-gray-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="text-white hover:text-red-200 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: '👤' },
              { id: 'albums', label: `Albums (${stats.albumCount})`, icon: '💿' },
              { id: 'songs', label: `Songs (${stats.songCount})`, icon: '🎵' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Bio Section */}
              {artist.ArtistBio && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">About</h3>
                  <p className="text-gray-600 leading-relaxed">{artist.ArtistBio}</p>
                </div>
              )}
              
              {/* Recent Songs Preview */}
              {songs.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Popular Songs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {songs.slice(0, 6).map((song) => (
                      <div key={song.SongID} className="flex-shrink-0">
                        <SongCard
                          id={song.SongID.toString()}
                          title={song.SongName}
                          artist={`${artist.FirstName} ${artist.LastName}`}
                          imageUrl={getFileUrl('profile-pictures/default.jpg')}
                          audioFilePath={song.FilePath}
                          listenCount={song.ListenCount}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'albums' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Albums</h3>
              {albums.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No albums found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {albums.map((album) => (
                    <div key={album.AlbumID} className="flex-shrink-0">
                      <AlbumCard
                        id={album.AlbumID.toString()}
                        title={album.AlbumName}
                        artist={`${artist.FirstName} ${artist.LastName}`}
                        imageUrl={album.AlbumCover ? getFileUrl(album.AlbumCover) : getFileUrl('profile-pictures/default.jpg')}
                      />
                      <div className="text-center mt-2">
                        <p className="text-xs text-gray-500">
                          {new Date(album.ReleaseDate).getFullYear()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'songs' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">All Songs</h3>
              {songs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No songs found</p>
              ) : (
                <div className="space-y-2">
                  {songs.map((song, index) => (
                    <div key={song.SongID} className="flex items-center p-3 hover:bg-gray-50 rounded-lg">
                      <div className="text-gray-400 w-8 text-sm">{index + 1}</div>
                      <div className="flex-1 ml-4">
                        <h4 className="font-medium text-gray-800">{song.SongName}</h4>
                        <p className="text-sm text-gray-500">
                          {song.AlbumName && `${song.AlbumName} • `}
                          {song.GenreName || 'Unknown Genre'}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500 mr-4">
                        {song.ListenCount.toLocaleString()} plays
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDuration(song.Duration)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}