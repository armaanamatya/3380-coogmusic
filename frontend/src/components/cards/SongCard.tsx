import React from 'react'
import { BaseCard } from './BaseCard'

interface SongCardProps {
  id: string
  title: string
  artist: string
  imageUrl?: string
  onClick?: () => void
}

export const SongCard: React.FC<SongCardProps> = ({
  id,
  title,
  artist,
  imageUrl,
  onClick
}) => {
  return (
    <BaseCard
      id={id}
      title={title}
      imageUrl={imageUrl}
      type="song"
      artist={artist}
      onClick={onClick}
    />
  )
}
