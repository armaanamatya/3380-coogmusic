import React, { useState, useEffect } from 'react'
import { GenreCard } from './cards/GenreCard'
import { genreApi, getFileUrl } from '../services/api'

interface GenreWithListens {
  GenreID: number
  GenreName: string
  Description?: string
  CreatedAt: string
  UpdatedAt: string
  songCount: number
  totalListens: number
}

export const GenreGrid: React.FC = () => {
  const [genres, setGenres] = useState<GenreWithListens[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setLoading(true)
        const response = await genreApi.getAllWithListens()
        
        if (!response.ok) {
          throw new Error('Failed to fetch genres')
        }
        
        const data = await response.json()
        setGenres(data.genres || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchGenres()
  }, [])

  const getGenreImageUrl = (genreName: string) => {
    // Map genre names to their corresponding image files
    const genreImageMap: { [key: string]: string } = {
      'Pop': 'pop.png',
      'Rock': 'rock.jpg',
      'Hip-Hop': 'hiphop.png',
      'Electronic': 'electronic.avif',
      'Dance': 'dance.jpg',
      'House': 'house.jpg',
      'Dubstep': 'dubstep.jpg',
      'Jazz': 'jazz.jpg',
      'Blues': 'blues.jpg',
      'Classical': 'classical.jpg',
      'Country': 'country.jpg',
      'R&B/Soul': 'r&b.jpg',
      'Alternative': 'alternative.png',
      'Folk': 'folk.jpg',
      'Ambient': 'ambient.jpg',
      'Metal': 'metal.jpg',
      'Reggae': 'reggae.jpg'
    }

    const imageName = genreImageMap[genreName] || 'default.jpg'
    return getFileUrl(`genre-imgs/${imageName}`)
  }

  const handleGenreClick = (genreId: number, genreName: string) => {
    console.log(`Clicked on genre: ${genreName} (ID: ${genreId})`)
    // Add navigation logic here if needed
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-600">Loading genres...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Music Genres</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {genres.map((genre) => (
          <GenreCard
            key={genre.GenreID}
            id={genre.GenreID.toString()}
            name={genre.GenreName}
            imageUrl={getGenreImageUrl(genre.GenreName)}
            listenCount={genre.totalListens}
            onClick={() => handleGenreClick(genre.GenreID, genre.GenreName)}
          />
        ))}
      </div>
    </div>
  )
}
