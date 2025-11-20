import React, { useState, useEffect } from 'react'

interface StarRatingProps {
  rating?: number // Current average rating (0-5)
  userRating?: number | null // User's personal rating (1-5 or null)
  totalRatings?: number // Total number of ratings
  onRate?: (rating: number) => void // Callback when user rates
  readonly?: boolean // If true, stars are not interactive
  size?: 'small' | 'medium' | 'large'
  showStats?: boolean // Show rating stats text
  loading?: boolean // Show loading state
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating = 0,
  userRating = null,
  totalRatings = 0,
  onRate,
  readonly = false,
  size = 'medium',
  showStats = true,
  loading = false
}) => {
  const [hoverRating, setHoverRating] = useState(0)
  const [isHovering, setIsHovering] = useState(false)

  // Size configurations
  const sizeConfig = {
    small: {
      starSize: 'w-4 h-4',
      textSize: 'text-xs',
      gap: 'gap-0.5'
    },
    medium: {
      starSize: 'w-5 h-5',
      textSize: 'text-sm',
      gap: 'gap-1'
    },
    large: {
      starSize: 'w-6 h-6',
      textSize: 'text-base',
      gap: 'gap-1'
    }
  }

  const config = sizeConfig[size]

  const handleStarClick = (starValue: number) => {
    if (!readonly && onRate && !loading) {
      onRate(starValue)
    }
  }

  const handleStarHover = (starValue: number) => {
    if (!readonly && !loading) {
      setHoverRating(starValue)
      setIsHovering(true)
    }
  }

  const handleMouseLeave = () => {
    setHoverRating(0)
    setIsHovering(false)
  }

  const getStarFill = (starIndex: number): 'full' | 'partial' | 'empty' => {
    // When hovering, show hover rating
    if (isHovering) {
      return starIndex <= hoverRating ? 'full' : 'empty'
    }
    
    // When user has rated, show their rating
    if (userRating && !readonly) {
      return starIndex <= userRating ? 'full' : 'empty'
    }
    
    // Otherwise show average rating (for readonly or when user hasn't rated)
    const displayRating = rating
    if (starIndex <= Math.floor(displayRating)) {
      return 'full'
    } else if (starIndex === Math.floor(displayRating) + 1 && displayRating % 1 !== 0) {
      return 'partial'
    } else {
      return 'empty'
    }
  }

  const StarIcon: React.FC<{ 
    fill: 'full' | 'partial' | 'empty'
    starIndex: number
    className?: string
  }> = ({ fill, starIndex, className = '' }) => {
    const baseClass = `${config.starSize} ${className}`
    
    // Determine color based on context
    const isUserRating = userRating && !readonly && !isHovering && starIndex <= userRating
    const isHoverRating = isHovering && starIndex <= hoverRating
    
    if (fill === 'full') {
      const starColor = isUserRating ? 'text-blue-500' : isHoverRating ? 'text-yellow-400' : 'text-yellow-500'
      return (
        <svg className={`${baseClass} ${starColor} fill-current transition-colors duration-200`} 
             viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      )
    } else if (fill === 'partial') {
      return (
        <svg className={`${baseClass} text-yellow-500 transition-colors duration-200`} viewBox="0 0 24 24">
          <defs>
            <linearGradient id={`grad-${starIndex}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset={`${((rating % 1) * 100)}%`} stopColor="currentColor" />
              <stop offset={`${((rating % 1) * 100)}%`} stopColor="transparent" />
            </linearGradient>
          </defs>
          <path 
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={`url(#grad-${starIndex})`}
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
      )
    } else {
      const emptyHoverColor = !readonly ? 'hover:text-yellow-400' : ''
      return (
        <svg className={`${baseClass} text-gray-300 ${emptyHoverColor} transition-colors duration-200`} 
             viewBox="0 0 24 24" 
             fill="none" 
             stroke="currentColor" 
             strokeWidth="1">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      )
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center space-x-2">
        {/* Stars */}
        <div 
          className={`flex items-center ${config.gap} ${readonly ? '' : 'cursor-pointer'}`}
          onMouseLeave={handleMouseLeave}
        >
          {[1, 2, 3, 4, 5].map((starIndex) => (
            <button
              key={starIndex}
              type="button"
              className={`focus:outline-none ${
                readonly || loading 
                  ? 'cursor-default' 
                  : 'cursor-pointer hover:scale-110 transition-transform'
              } ${loading ? 'opacity-50' : ''}`}
              onClick={() => handleStarClick(starIndex)}
              onMouseEnter={() => handleStarHover(starIndex)}
              disabled={readonly || loading}
              aria-label={`Rate ${starIndex} star${starIndex > 1 ? 's' : ''}`}
            >
              <StarIcon 
                fill={getStarFill(starIndex)}
                starIndex={starIndex}
              />
            </button>
          ))}
        </div>

        {/* Rating Stats */}
        {showStats && (
          <div className={`flex items-center space-x-2 ${config.textSize} text-gray-600`}>
            <span className="font-medium">
              {rating > 0 ? rating.toFixed(1) : '0.0'}
            </span>
            {totalRatings > 0 && (
              <span className="text-gray-500">
                ({totalRatings.toLocaleString()} rating{totalRatings !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        )}
      </div>

      {/* User Rating Indicator */}
      {userRating && !readonly && !isHovering && (
        <div className={`mt-1 ${config.textSize} text-blue-600 font-medium`}>
          Your rating: {userRating} star{userRating > 1 ? 's' : ''}
        </div>
      )}

      {/* Hover Feedback */}
      {isHovering && !readonly && (
        <div className={`mt-1 ${config.textSize} text-gray-600`}>
          Click to rate {hoverRating} star{hoverRating > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}