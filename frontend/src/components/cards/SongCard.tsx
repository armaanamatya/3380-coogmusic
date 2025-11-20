import React from 'react'
import { BaseCard } from './BaseCard'

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
    <BaseCard
      title={title}
      subtitle={artist}
      imageUrl={imageUrl}
      onClick={handleCardClick}
      stats={listenCount ? `${listenCount.toLocaleString()} listens` : undefined}
      actionButtons={
        onAddToPlaylist ? [
          {
            label: 'Add to playlist',
            onClick: handleAddToPlaylist,
            icon: 'plus'
          }
        ] : undefined
      }
    />
  )
}
