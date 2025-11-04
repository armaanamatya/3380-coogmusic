import { useState, useEffect } from 'react'
import { PlaylistCard } from './cards'
import { playlistApi, getFileUrl } from '../services/api'
import { useAuth } from '../hooks/useAuth'

interface Playlist {
  PlaylistID: number
  PlaylistName: string
  Description?: string
  IsPublic: number
  CreatedAt: string
  UpdatedAt: string
}

interface MyPlaylistsSectionProps {
  onCreatePlaylist: () => void
  onPlaylistClick: (playlist: { id: number; name: string }) => void
}

export const MyPlaylistsSection: React.FC<MyPlaylistsSectionProps> = ({
  onCreatePlaylist,
  onPlaylistClick
}) => {
  const { user } = useAuth()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUserPlaylists()
  }, [user?.userId])

  const fetchUserPlaylists = async () => {
    if (!user?.userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await playlistApi.getAll({ userId: user.userId })
      if (!response.ok) {
        throw new Error('Failed to fetch playlists')
      }
      
      const data = await response.json()
      setPlaylists(data.playlists || [])
    } catch (err: any) {
      console.error('Error fetching user playlists:', err)
      setError(err.message || 'Failed to load playlists')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePlaylist = async (playlistId: number) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) {
      return
    }

    try {
      const response = await playlistApi.delete(playlistId)
      if (!response.ok) {
        throw new Error('Failed to delete playlist')
      }
      
      // Refresh playlists after deletion
      await fetchUserPlaylists()
    } catch (err: any) {
      console.error('Error deleting playlist:', err)
      alert('Failed to delete playlist: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-red-700 mb-4">My Playlists</h2>
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-600">Loading your playlists...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-red-700 mb-4">My Playlists</h2>
        <div className="flex justify-center items-center py-8">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-red-700">My Playlists</h2>
        <button
          onClick={onCreatePlaylist}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Playlist
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-600 mb-4">You haven't created any playlists yet.</div>
          <button
            onClick={onCreatePlaylist}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Create Your First Playlist
          </button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {playlists.map((playlist) => (
            <div key={playlist.PlaylistID} className="flex-shrink-0 relative group">
              <PlaylistCard
                id={playlist.PlaylistID.toString()}
                title={playlist.PlaylistName}
                imageUrl={getFileUrl('profile-pictures/default.jpg')}
                onClick={() => onPlaylistClick({
                  id: playlist.PlaylistID,
                  name: playlist.PlaylistName
                })}
              />
              <div className="text-center mt-2">
                <p className="text-xs text-gray-600">
                  {playlist.IsPublic ? 'Public' : 'Private'}
                </p>
                <p className="text-xs text-gray-500">
                  Created {new Date(playlist.CreatedAt).toLocaleDateString()}
                </p>
              </div>
              
              {/* Delete button - shows on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeletePlaylist(playlist.PlaylistID)
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Delete playlist"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}