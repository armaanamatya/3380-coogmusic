import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { songApi, genreApi, albumApi } from '../services/api';

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

interface MusicUploadFormProps {
  onUploadSuccess?: () => void;
  onCancel?: () => void;
}

const MusicUploadForm: React.FC<MusicUploadFormProps> = ({ onUploadSuccess, onCancel }) => {
  const { user } = useAuth(); // Get current user
  const [formData, setFormData] = useState({
    songName: '',
    // Remove artistId - will use current user
    albumId: '',
    genreId: '',
    // Remove duration - will be calculated from audio file
    releaseDate: new Date().toISOString().split('T')[0]
  });
  
  const [files, setFiles] = useState({
    audioFile: null as File | null,
    albumCover: null as File | null
  });
  
  const [genres, setGenres] = useState<Genre[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

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
    if (!user?.userId) return;
    
    try {
      const response = await albumApi.getAll(user.userId);
      const data = await response.json();
      setAlbums(data.albums || []);
    } catch (error) {
      console.error('Error fetching albums:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles(prev => ({
        ...prev,
        [name]: selectedFiles[0]
      }));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles[0]) {
      const file = droppedFiles[0];
      if (file.type.startsWith('audio/') || ['.mp3', '.wav', '.flac', '.m4a', '.aac'].includes(file.name.toLowerCase().slice(-4))) {
        setFiles(prev => ({
          ...prev,
          audioFile: file
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!files.audioFile) {
      setError('Please select an audio file');
      return;
    }

    if (!formData.songName) {
      setError('Please fill in all required fields');
      return;
    }

    // Check if current user is an artist
    if (!user || user.userType !== 'Artist') {
      setError('Only artists can upload music');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const uploadData = new FormData();
      uploadData.append('audioFile', files.audioFile);
      
      if (files.albumCover) {
        uploadData.append('albumCover', files.albumCover);
      }

      // Add current user's ID as artistId
      uploadData.append('artistId', user.userId.toString());

      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          uploadData.append(key, value.toString());
        }
      });

      const response = await songApi.upload(uploadData);

      const result = await response.json();

      if (response.ok) {
        if (onUploadSuccess) {
          onUploadSuccess();
        }
        
        setFormData({
          songName: '',
          // Remove artistId - will use current user
          albumId: '',
          genreId: '',
          // Remove duration - will be calculated from audio file
          releaseDate: new Date().toISOString().split('T')[0]
        });
        setFiles({
          audioFile: null,
          albumCover: null
        });
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload Music</h2>
      
      {/* Show current artist info */}
      {user && user.userType === 'Artist' && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          Uploading as: {user.firstName} {user.lastName} (@{user.username})
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Audio File Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Audio File *
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {files.audioFile ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Selected: {files.audioFile.name}</p>
                <p className="text-xs text-gray-500">
                  Size: {(files.audioFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Drag and drop your audio file here, or
                </p>
                <input
                  type="file"
                  name="audioFile"
                  accept="audio/*,.mp3,.wav,.flac,.m4a,.aac"
                  onChange={handleFileChange}
                  className="hidden"
                  id="audioFile"
                />
                <label
                  htmlFor="audioFile"
                  className="inline-block px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600"
                >
                  Choose File
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Song Name */}
        <div className="space-y-2">
          <label htmlFor="songName" className="block text-sm font-medium text-gray-700">
            Song Name *
          </label>
          <input
            type="text"
            id="songName"
            name="songName"
            value={formData.songName}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Album Selection */}
        <div className="space-y-2">
          <label htmlFor="albumId" className="block text-sm font-medium text-gray-700">
            Album (Optional)
          </label>
          <select
            id="albumId"
            name="albumId"
            value={formData.albumId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No album / Single</option>
            {albums.map(album => (
              <option key={album.AlbumID} value={album.AlbumID}>
                {album.AlbumName} - {album.ArtistFirstName} {album.ArtistLastName}
              </option>
            ))}
          </select>
        </div>

        {/* Genre Selection */}
        <div className="space-y-2">
          <label htmlFor="genreId" className="block text-sm font-medium text-gray-700">
            Genre (Optional)
          </label>
          <select
            id="genreId"
            name="genreId"
            value={formData.genreId}
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

        {/* Release Date */}
        <div className="space-y-2">
          <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-700">
            Release Date
          </label>
          <input
            type="date"
            id="releaseDate"
            name="releaseDate"
            value={formData.releaseDate}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Album Cover Upload */}
        <div className="space-y-2">
          <label htmlFor="albumCover" className="block text-sm font-medium text-gray-700">
            Album Cover (Optional)
          </label>
          <input
            type="file"
            id="albumCover"
            name="albumCover"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {files.albumCover && (
            <p className="text-sm text-gray-600">Selected: {files.albumCover.name}</p>
          )}
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
            {loading ? 'Uploading...' : 'Upload Music'}
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

export default MusicUploadForm;