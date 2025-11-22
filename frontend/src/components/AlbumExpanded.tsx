import React, { useState, useEffect, useContext } from 'react';
import { songApi, albumApi, likeApi, ratingApi } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import { LikeButton } from './LikeButton';
import { StarRating } from './StarRating';

interface Song {
  SongID: number;
  SongName: string;
  ArtistFirstName: string;
  ArtistLastName: string;
  AlbumName?: string;
  GenreName?: string;
  Duration: number;
  ListenCount: number;
  FilePath?: string;
}

interface AlbumStats {
  likeCount: number;
  songCount: number;
  totalPlays: number;
  totalDuration: number;
  releaseDate: string;
}

interface AlbumRatingStats {
  averageRating: number;
  totalRatings: number;
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
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const { playSong } = useAudio();
  const [songs, setSongs] = useState<Song[]>([]);
  const [stats, setStats] = useState<AlbumStats | null>(null);
  const [ratingStats, setRatingStats] = useState<AlbumRatingStats | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbumData = async () => {
      try {
        setLoading(true);
        
        const promises = [
          songApi.getAll({ albumId }),
          albumApi.getStats(albumId),
          ratingApi.getAlbumRatingStats(albumId)
        ];

        // Add user-specific data if user is logged in
        if (user) {
          promises.push(
            ratingApi.getUserAlbumRating(user.userId, albumId),
            likeApi.isAlbumLiked(user.userId, albumId)
          );
        }
        
        const responses = await Promise.all(promises);
        const [songsResponse, statsResponse, ratingStatsResponse, userRatingResponse, isLikedResponse] = responses;

        if (songsResponse.ok) {
          const songsData = await songsResponse.json();
          setSongs(songsData.songs || []);
        }

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.stats);
        }

        if (ratingStatsResponse.ok) {
          const ratingData = await ratingStatsResponse.json();
          setRatingStats(ratingData);
        }

        if (user && userRatingResponse?.ok) {
          const userRatingData = await userRatingResponse.json();
          setUserRating(userRatingData.rating);
        }

        if (user && isLikedResponse?.ok) {
          const likedData = await isLikedResponse.json();
          setIsLiked(likedData.isLiked || false);
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
  }, [albumId, user]);

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

  const handleLike = async () => {
    if (!user) return;
    
    try {
      if (isLiked) {
        await likeApi.unlikeAlbum(user.userId, albumId);
        setIsLiked(false);
        if (stats) {
          setStats({ ...stats, likeCount: stats.likeCount - 1 });
        }
      } else {
        await likeApi.likeAlbum(user.userId, albumId);
        setIsLiked(true);
        if (stats) {
          setStats({ ...stats, likeCount: stats.likeCount + 1 });
        }
      }
    } catch (error) {
      console.error('Error toggling album like:', error);
    }
  };

  const handleRate = async (rating: number) => {
    if (!user) return;
    
    try {
      await ratingApi.rateAlbum(user.userId, albumId, rating);
      setUserRating(rating);
      
      // Refresh rating stats
      const response = await ratingApi.getAlbumRatingStats(albumId);
      if (response.ok) {
        const newStats = await response.json();
        setRatingStats(newStats);
      }
    } catch (error) {
      console.error('Error rating album:', error);
    }
  };

  const handlePlaySong = async (song: Song, songIndex: number) => {
    try {
      // Convert all album songs to the format expected by AudioContext
      const queue = songs.map(s => ({
        id: s.SongID.toString(),
        title: s.SongName,
        artist: `${s.ArtistFirstName} ${s.ArtistLastName}`,
        audioFilePath: s.FilePath || '',
        imageUrl: '',
        averageRating: 0,
        totalRatings: 0,
        userRating: null as number | null,
        isLiked: false,
        likeCount: 0,
        listenCount: s.ListenCount
      }));

      // Enrich the current song with rating and like data if user is logged in
      if (user?.userId) {
        const [ratingStatsResponse, userRatingResponse, likeStatusResponse] = await Promise.all([
          ratingApi.getSongRatingStats(song.SongID),
          ratingApi.getUserSongRating(song.SongID, user.userId),
          likeApi.isSongLiked(user.userId, song.SongID)
        ]);

        if (ratingStatsResponse.ok) {
          const ratingStats = await ratingStatsResponse.json();
          queue[songIndex].averageRating = ratingStats.averageRating;
          queue[songIndex].totalRatings = ratingStats.totalRatings;
        }

        if (userRatingResponse.ok) {
          const userRating = await userRatingResponse.json();
          queue[songIndex].userRating = userRating.rating;
        }

        if (likeStatusResponse.ok) {
          const likeStatus = await likeStatusResponse.json();
          queue[songIndex].isLiked = likeStatus.isLiked;
          queue[songIndex].likeCount = likeStatus.likeCount;
        }
      }

      // Play the song with the entire album as queue (without opening the player modal)
      playSong(queue[songIndex], queue, songIndex, false);
    } catch (error) {
      console.error('Error playing song:', error);
    }
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

              {/* Like and Rating Controls */}
              {user && (
                <div className="mt-4 flex items-center space-x-4" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-white bg-opacity-20 rounded-lg px-3 py-2">
                    <LikeButton
                      isLiked={isLiked}
                      likeCount={stats?.likeCount || 0}
                      onToggleLike={handleLike}
                      size="medium"
                      showCount={true}
                      variant="heart"
                    />
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg px-3 py-2">
                    <StarRating
                      rating={ratingStats?.averageRating || 0}
                      userRating={userRating}
                      totalRatings={ratingStats?.totalRatings || 0}
                      onRate={handleRate}
                      size="medium"
                      showStats={true}
                    />
                  </div>
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
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200 group"
                >
                  <div className="flex items-center gap-4">
                    {/* Play Button */}
                    <button
                      onClick={() => handlePlaySong(song, index)}
                      className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                      title="Play song"
                    >
                      <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>

                    {/* Position Number */}
                    <div className="text-gray-400 font-mono w-8 text-center group-hover:opacity-0 transition-opacity">
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

