import React, { useState, useEffect } from 'react';
import { songApi, getFileUrl } from '../services/api';

interface Song {
  SongID: number;
  SongName: string;
  ArtistFirstName: string;
  ArtistLastName: string;
  AlbumName?: string;
  GenreName?: string;
  Duration: number;
  ListenCount: number;
  FilePath: string;
  FileSize: number;
  ReleaseDate: string;
  CreatedAt: string;
}

interface MusicLibraryProps {
  onEditSong?: (song: Song) => void;
  onDeleteSong?: (songId: number) => void;
  refreshTrigger?: number;
}

const MusicLibrary: React.FC<MusicLibraryProps> = ({ onEditSong, onDeleteSong, refreshTrigger }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSong, setSelectedSong] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    artistId: '',
    genreId: '',
    albumId: ''
  });

  useEffect(() => {
    fetchSongs();
  }, [currentPage, filters, refreshTrigger]);

  const fetchSongs = async () => {
    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (filters.artistId) queryParams.append('artistId', filters.artistId);
      if (filters.genreId) queryParams.append('genreId', filters.genreId);
      if (filters.albumId) queryParams.append('albumId', filters.albumId);

      const response = await songApi.getAll({
        page: currentPage,
        limit: 20,
        ...(filters.artistId && { artistId: parseInt(filters.artistId) }),
        ...(filters.genreId && { genreId: parseInt(filters.genreId) }),
        ...(filters.albumId && { albumId: parseInt(filters.albumId) })
      });
      const data = await response.json();

      if (response.ok) {
        setSongs(data.songs || []);
      } else {
        setError(data.error || 'Failed to fetch songs');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Fetch songs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (songId: number) => {
    if (!confirm('Are you sure you want to delete this song? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await songApi.delete(songId);

      if (response.ok) {
        setSongs(prev => prev.filter(song => song.SongID !== songId));
        if (onDeleteSong) {
          onDeleteSong(songId);
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete song');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Delete song error:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const playPreview = (filePath: string) => {
    const audio = new Audio(getFileUrl(filePath));
    audio.play().catch(err => {
      console.error('Audio play error:', err);
      setError('Could not play audio file');
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Music Library</h2>
        <button
          onClick={fetchSongs}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : songs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No songs found. Upload your first song to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Songs List */}
          <div className="grid gap-4">
            {songs.map((song) => (
              <div
                key={song.SongID}
                className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    {/* Song Info */}
                    <div className="space-y-1">
                      <h3 className="font-medium text-gray-900">{song.SongName}</h3>
                      <p className="text-sm text-gray-600">
                        {song.ArtistFirstName} {song.ArtistLastName}
                      </p>
                      {song.AlbumName && (
                        <p className="text-xs text-gray-500">{song.AlbumName}</p>
                      )}
                    </div>

                    {/* Genre & Duration */}
                    <div className="space-y-1">
                      {song.GenreName && (
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {song.GenreName}
                        </span>
                      )}
                      <p className="text-sm text-gray-600">
                        Duration: {formatDuration(song.Duration)}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">
                        Plays: {song.ListenCount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Size: {formatFileSize(song.FileSize)}
                      </p>
                    </div>

                    {/* Release Date */}
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">
                        Released: {formatDate(song.ReleaseDate)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Uploaded: {formatDate(song.CreatedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => playPreview(song.FilePath)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                      title="Play Preview"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {onEditSong && (
                      <button
                        onClick={() => onEditSong(song)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                        title="Edit Song"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(song.SongID)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      title="Delete Song"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    <a
                      href={getFileUrl(song.FilePath)}
                      download
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-full"
                      title="Download"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center space-x-2 pt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-600">
              Page {currentPage}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={songs.length < 20}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicLibrary;