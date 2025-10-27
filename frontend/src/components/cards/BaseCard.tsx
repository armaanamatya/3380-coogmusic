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

const getTypeColor = (type: string) => {
  switch (type) {
    case 'song': return 'bg-blue-100 text-blue-800'
    case 'artist': return 'bg-green-100 text-green-800'
    case 'playlist': return 'bg-purple-100 text-purple-800'
    case 'album': return 'bg-orange-100 text-orange-800'
    case 'genre': return 'bg-pink-100 text-pink-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export const BaseCard: React.FC<BaseCardProps> = ({
  title,
  imageUrl,
  type,
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
        <div className="absolute top-1 right-1">
          <span className={`px-2 py-1 text-sm font-semibold rounded-full ${getTypeColor(type)}`}>
            {type}
          </span>
        </div>
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
