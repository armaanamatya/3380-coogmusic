import React, { useState, useEffect } from 'react'
import { followApi } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

interface SmallArtistCardProps {
  id: string
  name: string
  imageUrl?: string
  onClick?: () => void
  showFollowButton?: boolean
  onFollowChange?: () => void
  verified?: boolean
  followerCount?: number
}

export const SmallArtistCard: React.FC<SmallArtistCardProps> = ({
  id,
  name,
  imageUrl,
  onClick,
  showFollowButton = true,
  onFollowChange,
  verified = false,
  followerCount
}) => {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && showFollowButton) {
      checkFollowStatus()
    }
  }, [user, id, showFollowButton])

  const checkFollowStatus = async () => {
    if (!user) return
    
    try {
      const response = await followApi.checkFollowStatus(user.userId, parseInt(id))
      const data = await response.json()
      setIsFollowing(data.isFollowing)
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!user || loading) return
    
    setLoading(true)
    try {
      if (isFollowing) {
        const response = await followApi.unfollowArtist(user.userId, parseInt(id))
        if (response.ok) {
          setIsFollowing(false)
          onFollowChange?.()
        }
      } else {
        const response = await followApi.followArtist(user.userId, parseInt(id))
        if (response.ok) {
          setIsFollowing(true)
          onFollowChange?.()
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <div
        className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden w-48"
        onClick={onClick}
      >
        <div className="aspect-square bg-gray-200 relative">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-2">
          <h3 className="font-semibold text-gray-800 truncate text-xs">{name}</h3>
          {followerCount !== undefined && (
            <p className="text-xs text-gray-600 mt-1">
              {followerCount.toLocaleString()} followers
            </p>
          )}
        </div>
      </div>
      
      {verified && (
        <div className="absolute top-1 left-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center z-10">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      
      {user && showFollowButton && (
        <button
          onClick={handleFollowClick}
          disabled={loading}
          className={`absolute top-1 right-1 px-2 py-1 text-xs font-medium rounded-full transition-colors ${
            isFollowing
              ? 'bg-gray-600 text-white hover:bg-gray-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  )
}