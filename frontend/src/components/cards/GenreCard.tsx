import React from 'react'
import { BaseCard } from './BaseCard'

interface GenreCardProps {
  id: string
  name: string
  imageUrl?: string
  listenCount?: number
  onClick?: () => void
}

export const GenreCard: React.FC<GenreCardProps> = ({
  id,
  name,
  imageUrl,
  listenCount,
  onClick
}) => {
  return (
    <BaseCard
      id={id}
      title={name}
      imageUrl={imageUrl}
      type="genre"
      onClick={onClick}
      listenCount={listenCount}
    />
  )
}


