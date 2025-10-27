import React from 'react'

interface BaseCardProps {
  id: string
  title: string
  imageUrl?: string
  type: 'song' | 'artist' | 'playlist' | 'album' | 'genre'
  artist?: string
  listenCount?: number
  onClick?: () => void
}

export const BaseCard: React.FC<BaseCardProps> = ({
  title,
  imageUrl,
  artist,
  listenCount,
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
        {listenCount !== undefined && (
          <p className="text-xs text-gray-600 mt-1">
            {listenCount.toLocaleString()} listens
          </p>
        )}
      </div>
    </div>
  )
}
