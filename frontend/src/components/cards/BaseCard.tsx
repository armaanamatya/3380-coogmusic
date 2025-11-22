import React from 'react'
import { StarRating } from '../StarRating'
import { LikeButton } from '../LikeButton'

interface BaseCardProps {
  id: string
  title: string
  imageUrl?: string
  type: 'song' | 'artist' | 'playlist' | 'album' | 'genre'
  artist?: string
  listenCount?: number
  rating?: number
  likeCount?: number
  isLiked?: boolean
  userRating?: number | null
  totalRatings?: number
  showStats?: boolean
  onClick?: () => void
  onLike?: () => void
  onRate?: (rating: number) => void
}

export const BaseCard: React.FC<BaseCardProps> = ({
  title,
  imageUrl,
  type,
  artist,
  listenCount,
  rating,
  likeCount,
  isLiked = false,
  userRating,
  totalRatings,
  showStats = false,
  onClick,
  onLike,
  onRate
}) => {
  return (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden w-64"
      onClick={onClick}
    >
      <div className="aspect-square bg-gray-200 relative">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-800 truncate text-sm">{title}</h3>
        {artist && (
          <p className="text-sm text-gray-500 mt-1 truncate">{artist}</p>
        )}
        
        {showStats && (type === 'song' || type === 'album') && (
          <div className="mt-2 space-y-1" onClick={(e) => e.stopPropagation()}>
            {/* Star Rating */}
            {rating !== undefined && (
              <div className="flex items-center">
                <StarRating 
                  rating={rating}
                  userRating={userRating}
                  totalRatings={totalRatings}
                  onRate={onRate}
                  readonly={!onRate}
                  size="small"
                  showStats={false}
                />
                <span className="ml-1 text-xs text-gray-600">{typeof rating === 'number' ? rating.toFixed(1) : '0.0'}</span>
              </div>
            )}
            
            {/* Like Count and Listen Count */}
            <div className="flex items-center justify-between text-xs text-gray-600">
              {likeCount !== undefined && (
                <div className="flex items-center gap-1">
                  <LikeButton
                    isLiked={isLiked}
                    likeCount={likeCount}
                    onToggleLike={onLike}
                    size="small"
                    showCount={true}
                    disabled={!onLike}
                  />
                </div>
              )}
              
              {listenCount !== undefined && (
                <span className="text-gray-600">
                  {listenCount} listens
                </span>
              )}
            </div>
          </div>
        )}
        
        {!showStats && listenCount !== undefined && (
          <p className="text-xs text-gray-600 mt-1">
            {listenCount.toLocaleString()} listens
          </p>
        )}
      </div>
    </div>
  )
}
