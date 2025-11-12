import React, { useState, useEffect, useCallback } from 'react';
import { playlistApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';

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

interface PlaylistStats {
  likeCount: number;
  songCount: number;
  totalPlays: number;
  totalDuration: number;
  createdAt: string;
}

interface PlaylistDetails {
  PlaylistID: number;
  PlaylistName: string;
  UserID: number;
  Description?: string;
  IsPublic: number;
  CreatedAt: string;
  UpdatedAt: string;
  Username: string;
  FirstName: string;
  LastName: string;
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
  const { user } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [stats, setStats] = useState<PlaylistStats | null>(null);
  const [playlistDetails, setPlaylistDetails] = useState<PlaylistDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingSongId, setDeletingSongId] = useState<number | null>(null);

  const fetchPlaylistData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch songs, stats, and playlist details in parallel
      const [songsResponse, statsResponse, detailsResponse] = await Promise.all([
        playlistApi.getSongs(playlistId),
        playlistApi.getStats(playlistId),
        playlistApi.getById(playlistId)
      ]);

      if (songsResponse.ok) {
        const songsData = await songsResponse.json();
        // Ensure songs is always an array
        const songsArray = Array.isArray(songsData.songs) ? songsData.songs : 
                          Array.isArray(songsData) ? songsData : [];
        setSongs(songsArray);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        setPlaylistDetails(detailsData.playlist || detailsData);
      }

      if (!songsResponse.ok && !statsResponse.ok && !detailsResponse.ok) {
        setError('Failed to load playlist data');
      }
    } catch (err) {
      setError('Failed to load playlist data');
      console.error('Error fetching playlist data:', err);
    } finally {
      setLoading(false);
    }
  }, [playlistId]);

  useEffect(() => {
    fetchPlaylistData();
  }, [fetchPlaylistData]);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest('.playlist-modal-content')) {
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

  const formatCreatedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDeleteSong = async (songId: number) => {
    if (!window.confirm('Are you sure you want to remove this song from the playlist?')) {
      return;
    }

    try {
      setDeletingSongId(songId);
      const response = await playlistApi.removeSong(playlistId, songId);
      
      if (response.ok) {
        // Refresh the songs list and stats
        await fetchPlaylistData();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to remove song from playlist');
      }
    } catch (err) {
      console.error('Error removing song from playlist:', err);
      alert('Failed to remove song from playlist. Please try again.');
    } finally {
      setDeletingSongId(null);
    }
  };

  const isPlaylistOwner = user && playlistDetails && user.userId === playlistDetails.UserID;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="playlist-modal-content bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-red-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{playlistName}</h2>
              
              {/* Creator Info */}
              {playlistDetails && (
                <p className="text-red-100 mb-4">
                  by {playlistDetails.FirstName} {playlistDetails.LastName} (@{playlistDetails.Username})
                </p>
              )}
              
              {/* Playlist Stats */}
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
              
              {/* Created Date */}
              {stats?.createdAt && (
                <div className="mt-3 text-red-100">
                  Created {formatCreatedDate(stats.createdAt)}
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

                    {/* Delete Button - only show if user owns the playlist */}
                    {isPlaylistOwner && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSong(song.SongID);
                        }}
                        disabled={deletingSongId === song.SongID}
                        className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                        title="Remove song from playlist"
                      >
                        {deletingSongId === song.SongID ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    )}
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

