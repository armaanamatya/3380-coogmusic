import React, { useState, useEffect } from 'react';
import { songApi, genreApi, albumApi } from '../services/api';

interface Song {
  SongID: number;
  SongName: string;
  ArtistID: number;
  ArtistFirstName: string;
  ArtistLastName: string;
  AlbumID?: number;
  AlbumName?: string;
  GenreID?: number;
  GenreName?: string;
  Duration: number;
  ReleaseDate: string;
}

interface Genre {
  GenreID: number;
  GenreName: string;
}

interface Album {
  AlbumID: number;
  AlbumName: string;
  ArtistFirstName: string;
  ArtistLastName: string;
}

interface MusicEditFormProps {
  song: Song;
  onUpdateSuccess?: (songId: number) => void;
  onCancel?: () => void;
}

const MusicEditForm: React.FC<MusicEditFormProps> = ({ song, onUpdateSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    SongName: song.SongName,
    AlbumID: song.AlbumID?.toString() || '',
    GenreID: song.GenreID?.toString() || '',
    Duration: song.Duration.toString(),
    ReleaseDate: song.ReleaseDate
  });
  
  const [genres, setGenres] = useState<Genre[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGenres();
    fetchAlbums();
  }, []);

  const fetchGenres = async () => {
    try {
      const response = await genreApi.getAll();
      const data = await response.json();
      setGenres(data.genres || []);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const fetchAlbums = async () => {
    try {
      const response = await albumApi.getAll();
      const data = await response.json();
      setAlbums(data.albums || []);
    } catch (error) {
      console.error('Error fetching albums:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.SongName.trim()) {
      setError('Song name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updateData: any = {
        SongName: formData.SongName.trim(),
        Duration: parseInt(formData.Duration) || 0,
        ReleaseDate: formData.ReleaseDate
      };

      // Only include AlbumID if it's not empty
      if (formData.AlbumID) {
        updateData.AlbumID = parseInt(formData.AlbumID);
      } else {
        updateData.AlbumID = null;
      }

      // Only include GenreID if it's not empty
      if (formData.GenreID) {
        updateData.GenreID = parseInt(formData.GenreID);
      } else {
        updateData.GenreID = null;
      }

      const response = await songApi.update(song.SongID, updateData);

      const result = await response.json();

      if (response.ok) {
        if (onUpdateSuccess) {
          onUpdateSuccess(song.SongID);
        }
      } else {
        setError(result.error || 'Update failed');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Song</h2>
      
      {/* Song Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Current Song Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Artist:</span>
            <p className="text-gray-600">{song.ArtistFirstName} {song.ArtistLastName}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Current Album:</span>
            <p className="text-gray-600">{song.AlbumName || 'No album'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Current Genre:</span>
            <p className="text-gray-600">{song.GenreName || 'No genre'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Song ID:</span>
            <p className="text-gray-600">{song.SongID}</p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Song Name */}
        <div className="space-y-2">
          <label htmlFor="SongName" className="block text-sm font-medium text-gray-700">
            Song Name *
          </label>
          <input
            type="text"
            id="SongName"
            name="SongName"
            value={formData.SongName}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Album Selection */}
        <div className="space-y-2">
          <label htmlFor="AlbumID" className="block text-sm font-medium text-gray-700">
            Album
          </label>
          <select
            id="AlbumID"
            name="AlbumID"
            value={formData.AlbumID}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No album / Single</option>
            {albums
              .filter(album => 
                // Show albums from the same artist or the current album
                album.ArtistFirstName === song.ArtistFirstName && 
                album.ArtistLastName === song.ArtistLastName
              )
              .map(album => (
                <option key={album.AlbumID} value={album.AlbumID}>
                  {album.AlbumName}
                </option>
              ))
            }
          </select>
          <p className="text-xs text-gray-500">
            Only albums from the same artist ({song.ArtistFirstName} {song.ArtistLastName}) are shown
          </p>
        </div>

        {/* Genre Selection */}
        <div className="space-y-2">
          <label htmlFor="GenreID" className="block text-sm font-medium text-gray-700">
            Genre
          </label>
          <select
            id="GenreID"
            name="GenreID"
            value={formData.GenreID}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a genre</option>
            {genres.map(genre => (
              <option key={genre.GenreID} value={genre.GenreID}>
                {genre.GenreName}
              </option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label htmlFor="Duration" className="block text-sm font-medium text-gray-700">
            Duration (seconds)
          </label>
          <input
            type="number"
            id="Duration"
            name="Duration"
            value={formData.Duration}
            onChange={handleInputChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {formData.Duration && (
            <p className="text-sm text-gray-500">
              Duration: {Math.floor(parseInt(formData.Duration) / 60)}:{(parseInt(formData.Duration) % 60).toString().padStart(2, '0')}
            </p>
          )}
        </div>

        {/* Release Date */}
        <div className="space-y-2">
          <label htmlFor="ReleaseDate" className="block text-sm font-medium text-gray-700">
            Release Date
          </label>
          <input
            type="date"
            id="ReleaseDate"
            name="ReleaseDate"
            value={formData.ReleaseDate}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Note about audio file */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> The audio file and artist cannot be changed. To change the artist or replace the audio file, you'll need to delete this song and upload a new one.
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 py-2 px-4 rounded-md text-white font-medium ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {loading ? 'Updating...' : 'Update Song'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default MusicEditForm;