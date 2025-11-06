import React, { useState, useEffect } from 'react';
import { songApi, albumApi } from '../services/api';

interface Song {
  SongID: number;
  SongName: string;
  ArtistFirstName: string;
  ArtistLastName: string;
  AlbumName?: string;
  GenreName?: string;
  Duration: number;
  ListenCount: number;
}

interface AlbumStats {
  likeCount: number;
  songCount: number;
  totalPlays: number;
  totalDuration: number;
  releaseDate: string;
}

interface AlbumExpandedProps {
  albumId: number;
  albumName: string;
  onClose: () => void;
}

export const AlbumExpanded: React.FC<AlbumExpandedProps> = ({
  albumId,
  albumName,
  onClose
}) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [stats, setStats] = useState<AlbumStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbumData = async () => {
      try {
        setLoading(true);
        
        // Fetch songs and stats in parallel
        const [songsResponse, statsResponse] = await Promise.all([
          songApi.getAll({ albumId }),
          albumApi.getStats(albumId)
        ]);

        if (songsResponse.ok) {
          const songsData = await songsResponse.json();
          setSongs(songsData.songs || []);
        }

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.stats);
        }

        if (!songsResponse.ok && !statsResponse.ok) {
          setError('Failed to load album data');
        }
      } catch (err) {
        setError('Failed to load album data');
        console.error('Error fetching album data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumData();
  }, [albumId]);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest('.album-modal-content')) {
        return; // Click is inside modal content, don't close
      }
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatReleaseDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="album-modal-content bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-red-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-4">{albumName}</h2>
              
              {/* Album Stats */}
              {stats && (
                <div className="flex space-x-6 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-xl">{stats.songCount}</div>
                    <div className="text-red-200">Songs</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-xl">{formatNumber(stats.totalPlays)}</div>
                    <div className="text-red-200">Total Plays</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-xl">{formatTotalDuration(stats.totalDuration)}</div>
                    <div className="text-red-200">Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-xl">{stats.likeCount}</div>
                    <div className="text-red-200">Likes</div>
                  </div>
                </div>
              )}
              
              {/* Release Date */}
              {stats?.releaseDate && (
                <div className="mt-3 text-red-100">
                  Released {formatReleaseDate(stats.releaseDate)}
                </div>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="text-white hover:text-red-200 transition-colors ml-4"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
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
              <p className="text-gray-600">This album is empty</p>
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

      </div>
    </div>
  );
};

