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
  userRating?: number | null
  totalRatings?: number
  onClick?: () => void
  onLike?: () => void
  onRate?: (rating: number) => void
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
  userRating,
  totalRatings,
  onClick,
  onLike,
  onRate
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
      userRating={userRating}
      totalRatings={totalRatings}
      showStats={false}
      onClick={onClick}
      onLike={onLike}
      onRate={onRate}
    />
  )
}
