# GenreCard Component

A React component that displays genre information in a card format with title, image, and listen count.

## Features

- **Title Display**: Shows the genre name prominently
- **Image Support**: Displays genre images with fallback handling
- **Listen Count**: Shows the total number of listens for the genre
- **Click Handling**: Supports click events for navigation or actions
- **Responsive Design**: Adapts to different screen sizes
- **Consistent Styling**: Uses the BaseCard component for consistent appearance

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for the genre |
| `name` | `string` | Yes | Display name of the genre |
| `imageUrl` | `string` | No | URL of the genre image |
| `listenCount` | `number` | No | Total number of listens for this genre |
| `onClick` | `() => void` | No | Callback function when the card is clicked |

## Usage

### Basic Usage

```tsx
import { GenreCard } from './cards/GenreCard'

<GenreCard
  id="1"
  name="Rock"
  imageUrl="/path/to/rock-image.jpg"
  listenCount={15420}
  onClick={() => console.log('Rock genre clicked')}
/>
```

### With API Data

```tsx
import { GenreCard } from './cards/GenreCard'
import { genreApi, getFileUrl } from '../services/api'

const [genres, setGenres] = useState([])

useEffect(() => {
  const fetchGenres = async () => {
    const response = await genreApi.getAllWithListens()
    const data = await response.json()
    setGenres(data.genres)
  }
  fetchGenres()
}, [])

return (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {genres.map((genre) => (
      <GenreCard
        key={genre.GenreID}
        id={genre.GenreID.toString()}
        name={genre.GenreName}
        imageUrl={getFileUrl(`genre-imgs/${genre.GenreName.toLowerCase()}.jpg`)}
        listenCount={genre.totalListens}
        onClick={() => navigateToGenre(genre.GenreID)}
      />
    ))}
  </div>
)
```

## Styling

The GenreCard uses Tailwind CSS classes and extends the BaseCard component. It includes:

- Pink color scheme for the genre type badge
- Hover effects with shadow transitions
- Responsive grid layout support
- Proper image aspect ratios
- Truncated text for long names

## Backend Integration

The component works with the following API endpoints:

- `GET /api/genres/with-listens` - Returns genres with listen counts
- `GET /api/files/{filename}` - Serves genre images

## Related Components

- `BaseCard` - The underlying card component
- `GenreGrid` - A grid layout component for multiple genre cards
- `ArtistCard` - Similar card component for artists
- `SongCard` - Similar card component for songs


