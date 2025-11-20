import React, { useState } from 'react'

interface LikeButtonProps {
  isLiked?: boolean // Current like state
  likeCount?: number // Total number of likes
  onToggleLike?: () => void // Callback when like is toggled
  disabled?: boolean // Disable the button
  size?: 'small' | 'medium' | 'large'
  showCount?: boolean // Show like count next to button
  variant?: 'heart' | 'thumb' // Icon style
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  isLiked = false,
  likeCount = 0,
  onToggleLike,
  disabled = false,
  size = 'medium',
  showCount = true,
  variant = 'heart'
}) => {
  const [isAnimating, setIsAnimating] = useState(false)

  // Size configurations
  const sizeConfig = {
    small: {
      iconSize: 'w-4 h-4',
      textSize: 'text-xs',
      padding: 'p-1',
      gap: 'gap-1'
    },
    medium: {
      iconSize: 'w-5 h-5',
      textSize: 'text-sm',
      padding: 'p-1.5',
      gap: 'gap-1.5'
    },
    large: {
      iconSize: 'w-6 h-6',
      textSize: 'text-base',
      padding: 'p-2',
      gap: 'gap-2'
    }
  }

  const config = sizeConfig[size]

  const handleClick = () => {
    if (!disabled && onToggleLike) {
      setIsAnimating(true)
      onToggleLike()
      
      // Reset animation after it completes
      setTimeout(() => setIsAnimating(false), 300)
    }
  }

  const HeartIcon: React.FC<{ filled: boolean; className?: string }> = ({ 
    filled, 
    className = '' 
  }) => {
    if (filled) {
      return (
        <svg 
          className={`${config.iconSize} ${className} text-red-500 fill-current`} 
          viewBox="0 0 24 24"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      )
    } else {
      return (
        <svg 
          className={`${config.iconSize} ${className} text-gray-500 hover:text-red-500 transition-colors`} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      )
    }
  }

  const ThumbIcon: React.FC<{ filled: boolean; className?: string }> = ({ 
    filled, 
    className = '' 
  }) => {
    if (filled) {
      return (
        <svg 
          className={`${config.iconSize} ${className} text-blue-500 fill-current`} 
          viewBox="0 0 24 24"
        >
          <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
        </svg>
      )
    } else {
      return (
        <svg 
          className={`${config.iconSize} ${className} text-gray-500 hover:text-blue-500 transition-colors`} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
        </svg>
      )
    }
  }

  return (
    <div className={`flex items-center ${config.gap}`}>
      <button
        type="button"
        className={`
          ${config.padding}
          flex items-center justify-center
          rounded-full
          transition-all duration-200
          ${disabled 
            ? 'cursor-not-allowed opacity-50' 
            : 'hover:bg-gray-100 active:scale-95 cursor-pointer'
          }
          ${isAnimating ? 'animate-pulse scale-110' : ''}
          focus:outline-none focus:ring-2 focus:ring-offset-1 
          ${isLiked 
            ? variant === 'heart' 
              ? 'focus:ring-red-300' 
              : 'focus:ring-blue-300'
            : 'focus:ring-gray-300'
          }
        `}
        onClick={handleClick}
        disabled={disabled}
        aria-label={`${isLiked ? 'Unlike' : 'Like'} this song`}
        aria-pressed={isLiked}
      >
        {variant === 'heart' ? (
          <HeartIcon 
            filled={isLiked} 
            className={isAnimating ? 'animate-bounce' : ''} 
          />
        ) : (
          <ThumbIcon 
            filled={isLiked} 
            className={isAnimating ? 'animate-bounce' : ''} 
          />
        )}
      </button>

      {showCount && (
        <span 
          className={`
            ${config.textSize} 
            font-medium
            transition-colors
            ${isLiked 
              ? variant === 'heart' 
                ? 'text-red-600' 
                : 'text-blue-600'
              : 'text-gray-600'
            }
          `}
        >
          {likeCount > 0 ? likeCount.toLocaleString() : '0'}
        </span>
      )}
    </div>
  )
}