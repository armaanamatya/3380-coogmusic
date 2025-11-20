import React from 'react'

interface SongCardProps {
  id: string
  title: string
  artist: string
  imageUrl?: string
  onClick?: () => void
  onAddToPlaylist?: (songId: number, songTitle: string) => void
  onPlaySong?: (song: { id: string; title: string; artist: string; audioFilePath?: string; imageUrl?: string }) => void
  listenCount?: number
  audioFilePath?: string
}

export const SongCard: React.FC<SongCardProps> = ({
  id,
  title,
  artist,
  imageUrl,
  onClick,
  onAddToPlaylist,
  onPlaySong,
  listenCount,
  audioFilePath,
}) => {
  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    if (onAddToPlaylist) {
      onAddToPlaylist(parseInt(id), title)
    }
  }

  const handleCardClick = () => {
    if (onPlaySong) {
      onPlaySong({ id, title, artist, audioFilePath, imageUrl })
    } else if (onClick) {
      onClick()
    }
  }

  return (
    <div className="relative group">
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden w-64">
        <div className="aspect-square bg-gray-200 relative" onClick={handleCardClick}>
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
          
          {/* Add to Playlist Button */}
          {onAddToPlaylist && (
            <button
              onClick={handleAddToPlaylist}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
              title="Add to playlist"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>

        <div className="p-3" onClick={handleCardClick}>
          <h3 className="font-semibold text-gray-800 truncate text-sm">{title}</h3>
          <p className="text-sm text-gray-500 mt-1 truncate">{artist}</p>
          
          {/* Listen Count */}
          {listenCount !== undefined && (
            <p className="text-xs text-gray-600 mt-2">
              {listenCount.toLocaleString()} listens
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
