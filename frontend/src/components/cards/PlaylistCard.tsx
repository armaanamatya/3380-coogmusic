import React from 'react'
import { BaseCard } from './BaseCard'

interface PlaylistCardProps {
  id: string
  title: string
  imageUrl?: string
  onClick?: () => void
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
  id,
  title,
  imageUrl,
  onClick
}) => {
  return (
    <BaseCard
      id={id}
      title={title}
      imageUrl={imageUrl}
      type="playlist"
      onClick={onClick}
    />
  )
}
