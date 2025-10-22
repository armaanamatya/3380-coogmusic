import React from 'react'
import { BaseCard } from './BaseCard'

interface ArtistCardProps {
  id: string
  name: string
  imageUrl?: string
  onClick?: () => void
}

export const ArtistCard: React.FC<ArtistCardProps> = ({
  id,
  name,
  imageUrl,
  onClick
}) => {
  return (
    <BaseCard
      id={id}
      title={name}
      imageUrl={imageUrl}
      type="artist"
      onClick={onClick}
    />
  )
}
