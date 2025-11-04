import { useState, useEffect } from 'react'
import { playlistApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'

interface Playlist {
  PlaylistID: number
  PlaylistName: string
  Description?: string
  IsPublic: number
  CreatedAt: string
}

interface AddToPlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  songId: number | null
  songTitle?: string
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  songId,
  songTitle
}) => {
  const { user } = useAuth()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(false)
  const [addingToPlaylist, setAddingToPlaylist] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen && user?.userId) {
      fetchUserPlaylists()
    }
  }, [isOpen, user?.userId])

  const fetchUserPlaylists = async () => {
    if (!user?.userId) return

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

  const handleAddToPlaylist = async (playlistId: number) => {
    if (!songId) return

    try {
      setAddingToPlaylist(playlistId)
      setError(null)

      const response = await playlistApi.addSong(playlistId, songId)
      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.error?.includes('already exists')) {
          throw new Error('Song is already in this playlist')
        }
        throw new Error(errorData.error || 'Failed to add song to playlist')
      }

      // Success - close modal and show success message
      onClose()
      // You could add a toast notification here
    } catch (err: any) {
      console.error('Error adding song to playlist:', err)
      setError(err.message || 'Failed to add song to playlist')
    } finally {
      setAddingToPlaylist(null)
    }
  }

  const handleClose = () => {
    setSearchTerm('')
    setError(null)
    setAddingToPlaylist(null)
    onClose()
  }

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.PlaylistName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Add to Playlist</h2>
            {songTitle && (
              <p className="text-sm text-gray-600 mt-1">"{songTitle}"</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Search input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search playlists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {/* Playlists list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-600">Loading playlists...</div>
            </div>
          ) : filteredPlaylists.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-600 mb-2">
                {playlists.length === 0 ? 'No playlists found' : 'No matching playlists'}
              </div>
              {playlists.length === 0 && (
                <p className="text-sm text-gray-500">Create a playlist first to add songs to it</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPlaylists.map((playlist) => (
                <button
                  key={playlist.PlaylistID}
                  onClick={() => handleAddToPlaylist(playlist.PlaylistID)}
                  disabled={addingToPlaylist !== null}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{playlist.PlaylistName}</h3>
                      <p className="text-sm text-gray-500">
                        {playlist.IsPublic ? 'Public' : 'Private'} • Created {new Date(playlist.CreatedAt).toLocaleDateString()}
                      </p>
                      {playlist.Description && (
                        <p className="text-xs text-gray-400 mt-1 truncate">{playlist.Description}</p>
                      )}
                    </div>
                    {addingToPlaylist === playlist.PlaylistID ? (
                      <div className="ml-3 text-red-600">
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="ml-3 text-red-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t">
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}