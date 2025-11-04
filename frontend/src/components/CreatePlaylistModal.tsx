import { useState } from 'react'
import { playlistApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'

interface CreatePlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  onPlaylistCreated: () => void
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onPlaylistCreated
}) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    playlistName: '',
    description: '',
    isPublic: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.userId) {
      setError('User not authenticated')
      return
    }

    if (!formData.playlistName.trim()) {
      setError('Playlist name is required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await playlistApi.create({
        playlistName: formData.playlistName.trim(),
        userId: user.userId,
        description: formData.description.trim() || undefined,
        isPublic: formData.isPublic
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create playlist')
      }

      // Reset form
      setFormData({
        playlistName: '',
        description: '',
        isPublic: false
      })

      // Notify parent component
      onPlaylistCreated()
      onClose()
    } catch (err: any) {
      console.error('Error creating playlist:', err)
      setError(err.message || 'Failed to create playlist')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        playlistName: '',
        description: '',
        isPublic: false
      })
      setError(null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Create New Playlist</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="playlistName" className="block text-sm font-medium text-gray-700 mb-1">
              Playlist Name *
            </label>
            <input
              type="text"
              id="playlistName"
              name="playlistName"
              value={formData.playlistName}
              onChange={handleInputChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="Enter playlist name"
              maxLength={255}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="Describe your playlist"
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleInputChange}
              disabled={loading}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded disabled:opacity-50"
            />
            <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
              Make this playlist public
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.playlistName.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}