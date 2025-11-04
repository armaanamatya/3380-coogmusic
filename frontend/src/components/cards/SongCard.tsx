import React from 'react'
import { BaseCard } from './BaseCard'

interface SongCardProps {
  id: string
  title: string
  artist: string
  imageUrl?: string
  onClick?: () => void
  onAddToPlaylist?: (songId: number, songTitle: string) => void
  listenCount?: number
}

export const SongCard: React.FC<SongCardProps> = ({
  id,
  title,
  artist,
  imageUrl,
  onClick,
  onAddToPlaylist,
  listenCount
}) => {
  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    if (onAddToPlaylist) {
      onAddToPlaylist(parseInt(id), title)
    }
  }

  return (
    <div className="relative group">
      <BaseCard
        id={id}
        title={title}
        imageUrl={imageUrl}
        type="song"
        artist={artist}
        listenCount={listenCount}
        onClick={onClick}
      />
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
  )
}
