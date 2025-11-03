import React, { useState, useEffect } from 'react';
import { playlistApi } from '../services/api';

interface Song {
  SongID: number;
  SongName: string;
  ArtistFirstName: string;
  ArtistLastName: string;
  AlbumName?: string;
  GenreName?: string;
  Duration: number;
  ListenCount: number;
  Position: number;
  AddedAt: string;
}

interface PlaylistExpandedProps {
  playlistId: number;
  playlistName: string;
  onClose: () => void;
}

export const PlaylistExpanded: React.FC<PlaylistExpandedProps> = ({
  playlistId,
  playlistName,
  onClose
}) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaylistSongs = async () => {
      try {
        setLoading(true);
        const response = await playlistApi.getSongs(playlistId);
        const data = await response.json();
        
        if (response.ok) {
          // Ensure songs is always an array
          const songsArray = Array.isArray(data.songs) ? data.songs : 
                            Array.isArray(data) ? data : [];
          setSongs(songsArray);
        } else {
          setError(data.error || 'Failed to load playlist songs');
        }
      } catch (err) {
        setError('Failed to load playlist songs');
        console.error('Error fetching playlist songs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylistSongs();
  }, [playlistId]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-red-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">{playlistName}</h2>
            <p className="text-red-100 mt-1">{songs.length} songs</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-3xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-600">Loading songs...</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : songs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">This playlist is empty</p>
            </div>
          ) : (
            <div className="space-y-2">
              {songs.map((song, index) => (
                <div
                  key={song.SongID}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="flex items-center gap-4">
                    {/* Position Number */}
                    <div className="text-gray-400 font-mono w-8 text-center">
                      {index + 1}
                    </div>

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {song.SongName}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {song.ArtistFirstName} {song.ArtistLastName}
                        {song.AlbumName && ` • ${song.AlbumName}`}
                      </p>
                    </div>

                    {/* Genre */}
                    {song.GenreName && (
                      <div className="hidden md:block">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {song.GenreName}
                        </span>
                      </div>
                    )}

                    {/* Duration */}
                    <div className="text-gray-600 font-mono text-sm w-16 text-right">
                      {formatDuration(song.Duration)}
                    </div>

                    {/* Listen Count */}
                    <div className="hidden sm:block text-gray-500 text-sm w-20 text-right">
                      {song.ListenCount.toLocaleString()} plays
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

