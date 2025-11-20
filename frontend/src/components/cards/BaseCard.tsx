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
  showStats?: boolean
  onClick?: () => void
}

export const BaseCard: React.FC<BaseCardProps> = ({
  title,
  imageUrl,
  artist,
  listenCount,
  rating,
  likeCount,
  isLiked = false,
  showStats = false,
  onClick
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
        
        {showStats && (
          <div className="mt-2 space-y-1">
            {/* Star Rating */}
            {rating !== undefined && (
              <div className="flex items-center">
                <StarRating 
                  rating={rating}
                  readonly={true}
                  size="small"
                  showStats={false}
                />
                <span className="ml-1 text-xs text-gray-600">{rating.toFixed(1)}</span>
              </div>
            )}
            
            {/* Like Count and Listen Count */}
            <div className="flex items-center justify-between text-xs text-gray-600">
              {likeCount !== undefined && (
                <div className="flex items-center gap-1">
                  <LikeButton
                    isLiked={isLiked}
                    likeCount={likeCount}
                    size="small"
                    showCount={true}
                    disabled={true}
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
