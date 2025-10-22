import React from 'react'
import { BaseCard } from './BaseCard'

interface AlbumCardProps {
  id: string
  title: string
  artist: string
  imageUrl?: string
  onClick?: () => void
}

export const AlbumCard: React.FC<AlbumCardProps> = ({
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
      type="album"
      artist={artist}
      onClick={onClick}
    />
  )
}
