import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { userApi, getFileUrl } from '../services/api';

interface ListeningHistoryItem {
  HistoryID: number;
  SongID: number;
  SongName: string;
  ArtistFirstName: string;
  ArtistLastName: string;
  AlbumName?: string;
  GenreName?: string;
  Duration: number;
  FilePath: string;
  AlbumCover?: string;
  ListenedAt: string;
  ListenDuration?: number;
}

interface RecentlyPlayedSongsProps {
  onPlaySong?: (song: {
    id: string;
    title: string;
    artist: string;
    audioFilePath?: string;
    imageUrl?: string;
  }) => void;
  refreshTrigger?: number; // Increment this to trigger refresh
}

function RecentlyPlayedSongs({ onPlaySong, refreshTrigger }: RecentlyPlayedSongsProps) {
  const { user } = useAuth();
  const [history, setHistory] = useState<ListeningHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListeningHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userApi.getHistory(user!.userId, { limit: 10 });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch listening history');
      }
      
      const data = await response.json();
      setHistory(data.history || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Error fetching listening history:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.userId) {
      fetchListeningHistory();
    }
  }, [user?.userId, fetchListeningHistory]);

  // Refresh when refreshTrigger changes (when new songs are played)
  useEffect(() => {
    if (refreshTrigger && user?.userId) {
      fetchListeningHistory();
    }
  }, [refreshTrigger, user?.userId, fetchListeningHistory]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlaySong = (item: ListeningHistoryItem) => {
    if (onPlaySong) {
      onPlaySong({
        id: item.SongID.toString(),
        title: item.SongName,
        artist: `${item.ArtistFirstName} ${item.ArtistLastName}`,
        audioFilePath: item.FilePath,
        imageUrl: item.AlbumCover ? getFileUrl(`album-covers/${item.AlbumCover}`) : undefined
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recently Played</h3>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Loading your recent plays...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recently Played</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchListeningHistory}
              className="mt-3 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recently Played</h3>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">No listening history yet</p>
            <p className="text-sm text-gray-500">Start playing songs to see them here!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.HistoryID}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer"
                onClick={() => handlePlaySong(item)}
              >
                {/* Song Cover/Icon */}
                <div className="relative flex-shrink-0">
                  {item.AlbumCover ? (
                    <img
                      src={getFileUrl(`album-covers/${item.AlbumCover}`)}
                      alt={item.AlbumName || 'Album cover'}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Play button overlay */}
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.SongName}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {item.ArtistFirstName} {item.ArtistLastName}
                    {item.AlbumName && ` • ${item.AlbumName}`}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(item.ListenedAt)}
                    </span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-400">
                      {formatDuration(item.Duration)}
                    </span>
                    {item.GenreName && (
                      <>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-400">{item.GenreName}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlaySong(item);
                  }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={fetchListeningHistory}
              className="w-full text-center text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              Refresh History
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecentlyPlayedSongs;