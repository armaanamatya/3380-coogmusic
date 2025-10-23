import React, { useState, useEffect } from 'react';
import { albumApi, artistApi } from '../services/api';

interface Album {
  AlbumID: number;
  AlbumName: string;
  ArtistID: number;
  ArtistFirstName: string;
  ArtistLastName: string;
  ReleaseDate: string;
  Description?: string;
  AlbumCover?: string;
  CreatedAt: string;
  UpdatedAt: string;
}

interface Artist {
  ArtistID: number;
  FirstName: string;
  LastName: string;
  Username: string;
}

interface AlbumManagerProps {
  refreshTrigger?: number;
}

const AlbumManager: React.FC<AlbumManagerProps> = ({ refreshTrigger }) => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  
  const [formData, setFormData] = useState({
    albumName: '',
    artistId: '',
    releaseDate: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    fetchAlbums();
    fetchArtists();
  }, [refreshTrigger]);

  const fetchAlbums = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await albumApi.getAll();
      const data = await response.json();

      if (response.ok) {
        setAlbums(data.albums || []);
      } else {
        setError(data.error || 'Failed to fetch albums');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Fetch albums error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArtists = async () => {
    try {
      const response = await artistApi.getAll();
      const data = await response.json();
      setArtists(data.artists || []);
    } catch (error) {
      console.error('Error fetching artists:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.albumName.trim() || !formData.artistId) {
      setError('Album name and artist are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await albumApi.create({
        albumName: formData.albumName.trim(),
        artistId: parseInt(formData.artistId),
        releaseDate: formData.releaseDate,
        description: formData.description.trim() || undefined
      });

      const result = await response.json();

      if (response.ok) {
        await fetchAlbums();
        setShowCreateForm(false);
        setFormData({
          albumName: '',
          artistId: '',
          releaseDate: new Date().toISOString().split('T')[0],
          description: ''
        });
      } else {
        setError(result.error || 'Failed to create album');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Create album error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingAlbum || !formData.albumName.trim()) {
      setError('Album name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await albumApi.update(editingAlbum.AlbumID, {
        AlbumName: formData.albumName.trim(),
        ReleaseDate: formData.releaseDate,
        Description: formData.description.trim() || null
      });

      const result = await response.json();

      if (response.ok) {
        await fetchAlbums();
        setEditingAlbum(null);
        setFormData({
          albumName: '',
          artistId: '',
          releaseDate: new Date().toISOString().split('T')[0],
          description: ''
        });
      } else {
        setError(result.error || 'Failed to update album');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Update album error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (albumId: number) => {
    if (!confirm('Are you sure you want to delete this album? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await albumApi.delete(albumId);

      if (response.ok) {
        setAlbums(prev => prev.filter(album => album.AlbumID !== albumId));
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete album');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Delete album error:', error);
    }
  };

  const startEdit = (album: Album) => {
    setEditingAlbum(album);
    setFormData({
      albumName: album.AlbumName,
      artistId: album.ArtistID.toString(),
      releaseDate: album.ReleaseDate,
      description: album.Description || ''
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingAlbum(null);
    setFormData({
      albumName: '',
      artistId: '',
      releaseDate: new Date().toISOString().split('T')[0],
      description: ''
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Album Manager</h2>
        <div className="space-x-2">
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setEditingAlbum(null);
              cancelEdit();
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {showCreateForm ? 'Cancel' : 'Create Album'}
          </button>
          <button
            onClick={fetchAlbums}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || editingAlbum) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-medium mb-4">
            {editingAlbum ? 'Edit Album' : 'Create New Album'}
          </h3>
          
          {editingAlbum && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <strong>Editing:</strong> {editingAlbum.AlbumName} by {editingAlbum.ArtistFirstName} {editingAlbum.ArtistLastName}
              </p>
            </div>
          )}

          <form onSubmit={editingAlbum ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="albumName" className="block text-sm font-medium text-gray-700 mb-1">
                  Album Name *
                </label>
                <input
                  type="text"
                  id="albumName"
                  name="albumName"
                  value={formData.albumName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {!editingAlbum && (
                <div>
                  <label htmlFor="artistId" className="block text-sm font-medium text-gray-700 mb-1">
                    Artist *
                  </label>
                  <select
                    id="artistId"
                    name="artistId"
                    value={formData.artistId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select an artist</option>
                    {artists.map(artist => (
                      <option key={artist.ArtistID} value={artist.ArtistID}>
                        {artist.FirstName} {artist.LastName} ({artist.Username})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-700 mb-1">
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
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional album description..."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white font-medium ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
                }`}
              >
                {loading ? 'Saving...' : (editingAlbum ? 'Update Album' : 'Create Album')}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingAlbum(null);
                  cancelEdit();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Albums List */}
      {loading && !showCreateForm && !editingAlbum ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No albums found. Create your first album to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {albums.map((album) => (
            <div
              key={album.AlbumID}
              className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  {/* Album Info */}
                  <div className="space-y-1">
                    <h3 className="font-medium text-gray-900">{album.AlbumName}</h3>
                    <p className="text-sm text-gray-600">
                      by {album.ArtistFirstName} {album.ArtistLastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      ID: {album.AlbumID}
                    </p>
                  </div>

                  {/* Release Date & Description */}
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      Released: {formatDate(album.ReleaseDate)}
                    </p>
                    {album.Description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {album.Description}
                      </p>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">
                      Created: {formatDate(album.CreatedAt)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Updated: {formatDate(album.UpdatedAt)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => startEdit(album)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                    title="Edit Album"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleDelete(album.AlbumID)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                    title="Delete Album"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlbumManager;