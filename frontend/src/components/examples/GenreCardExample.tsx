import React from 'react'
import { GenreCard } from '../cards/GenreCard'
import { getFileUrl } from '../../services/api'

/**
 * Example component demonstrating how to use the GenreCard component
 * This shows how to create individual genre cards with different properties
 */
export const GenreCardExample: React.FC = () => {
  // Example genre data - in a real app, this would come from an API
  const exampleGenres = [
    {
      id: '1',
      name: 'Rock',
      imageUrl: getFileUrl('genre-imgs/rock.jpg'),
      listenCount: 15420
    },
    {
      id: '2', 
      name: 'Pop',
      imageUrl: getFileUrl('genre-imgs/pop.png'),
      listenCount: 8930
    },
    {
      id: '3',
      name: 'Jazz',
      imageUrl: getFileUrl('genre-imgs/jazz.jpg'),
      listenCount: 5670
    },
    {
      id: '4',
      name: 'Electronic',
      imageUrl: getFileUrl('genre-imgs/electronic.avif'),
      listenCount: 12300
    },
    {
      id: '5',
      name: 'Classical',
      imageUrl: getFileUrl('genre-imgs/classical.jpg'),
      listenCount: 3450
    }
  ]

  const handleGenreClick = (genreId: string, genreName: string) => {
    console.log(`Genre clicked: ${genreName} (ID: ${genreId})`)
    // Add your navigation or action logic here
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Genre Card Examples</h2>
      <p className="text-gray-600 mb-6">
        These are example genre cards showing different genres with their listen counts.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {exampleGenres.map((genre) => (
          <GenreCard
            key={genre.id}
            id={genre.id}
            name={genre.name}
            imageUrl={genre.imageUrl}
            listenCount={genre.listenCount}
            onClick={() => handleGenreClick(genre.id, genre.name)}
          />
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Usage Example:</h3>
        <pre className="text-sm text-gray-700 overflow-x-auto">
{`<GenreCard
  id="1"
  name="Rock"
  imageUrl={getFileUrl('genre-imgs/rock.jpg')}
  listenCount={15420}
  onClick={() => handleGenreClick('1', 'Rock')}
/>`}
        </pre>
      </div>
    </div>
  )
}


