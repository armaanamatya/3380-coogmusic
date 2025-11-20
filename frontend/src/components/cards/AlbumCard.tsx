import React from 'react'
import { BaseCard } from './BaseCard'

interface AlbumCardProps {
  id: string
  title: string
  artist: string
  imageUrl?: string
  listenCount?: number
  rating?: number
  likeCount?: number
  isLiked?: boolean
  onClick?: () => void
}

export const AlbumCard: React.FC<AlbumCardProps> = ({
  id,
  title,
  artist,
  imageUrl,
  listenCount,
  rating,
  likeCount,
  isLiked,
  onClick
}) => {
  return (
    <BaseCard
      id={id}
      title={title}
      imageUrl={imageUrl}
      type="album"
      artist={artist}
      listenCount={listenCount}
      rating={rating}
      likeCount={likeCount}
      isLiked={isLiked}
      showStats={true}
      onClick={onClick}
    />
  )
}
