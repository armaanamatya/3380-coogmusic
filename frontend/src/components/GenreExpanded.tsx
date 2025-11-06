import { useState, useEffect } from 'react';
import { SongCard, AlbumCard } from './cards';
import { genreApi, getFileUrl } from '../services/api';

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
  ListenCount: number;
  FilePath: string;
  FileSize: number;
  ReleaseDate: string;
  CreatedAt: string;
}

interface Album {
  AlbumID: number;
  AlbumName: string;
  ArtistID: number;
  ArtistFirstName: string;
  ArtistLastName: string;
  ReleaseDate: string;
  Description?: string;
  songCount: number;
  totalListens: number;
  CreatedAt: string;
  UpdatedAt: string;
}

interface GenreStats {
  GenreID: number;
  GenreName: string;
  Description?: string;
  totalSongs: number;
  totalAlbums: number;
  totalListens: number;
}

interface GenreExpandedProps {
  genreId: number;
  genreName: string;
  onClose: () => void;
}

type TabType = 'overview' | 'songs' | 'albums';

export const GenreExpanded: React.FC<GenreExpandedProps> = ({
  genreId,
  onClose
}) => {
  const [genre, setGenre] = useState<GenreStats | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest('.genre-modal-content')) {
        return;
      }
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const fetchGenreData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [genreResponse, songsResponse, albumsResponse] = await Promise.all([
        genreApi.getById(genreId),
        genreApi.getSongs(genreId),
        genreApi.getAlbums(genreId)
      ]);

      if (!genreResponse.ok) {
        throw new Error('Failed to fetch genre data');
      }
      if (!songsResponse.ok) {
        throw new Error('Failed to fetch songs');
      }
      if (!albumsResponse.ok) {
        throw new Error('Failed to fetch albums');
      }

      const genreData = await genreResponse.json();
      const songsData = await songsResponse.json();
      const albumsData = await albumsResponse.json();

      setGenre(genreData.genre);
      setSongs(songsData.songs);
      setAlbums(albumsData.albums);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching genre data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenreData();
  }, [genreId]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };


  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">Loading genre...</div>
        </div>
      </div>
    );
  }

  if (error || !genre) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-4">Error</h3>
          <p className="text-gray-600 mb-4">{error || 'Genre not found'}</p>
          <button
            onClick={onClose}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="genre-modal-content bg-white rounded-lg max-w-6xl w-full h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex items-end justify-between">
            <div className="flex items-center space-x-6">
              {/* Genre Icon */}
              <div className="w-32 h-32 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              
              {/* Genre Info */}
              <div>
                <h1 className="text-4xl font-bold mb-2">{genre.GenreName}</h1>
                {genre.Description && (
                  <p className="text-purple-100 mb-4 text-lg max-w-2xl">{genre.Description}</p>
                )}
                <div className="flex space-x-6 text-purple-100">
                  <span>{formatNumber(genre.totalSongs)} songs</span>
                  <span>{formatNumber(genre.totalAlbums)} albums</span>
                  <span>{formatNumber(genre.totalListens)} total plays</span>
                </div>
              </div>
            </div>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'songs', label: `Songs (${songs.length})` },
              { key: 'albums', label: `Albums (${albums.length})` }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Songs</p>
                      <p className="text-2xl font-bold text-gray-900">{formatNumber(genre.totalSongs)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Albums</p>
                      <p className="text-2xl font-bold text-gray-900">{formatNumber(genre.totalAlbums)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Plays</p>
                      <p className="text-2xl font-bold text-gray-900">{formatNumber(genre.totalListens)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Songs Preview */}
              {songs.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Top Songs in {genre.GenreName}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {songs.slice(0, 6).map((song) => (
                      <SongCard
                        key={song.SongID}
                        id={song.SongID.toString()}
                        title={song.SongName}
                        artist={`${song.ArtistFirstName} ${song.ArtistLastName}`}
                        imageUrl={song.FilePath ? getFileUrl(song.FilePath) : ''}
                        listenCount={song.ListenCount}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Top Albums Preview */}
              {albums.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Albums in {genre.GenreName}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {albums.slice(0, 8).map((album) => (
                      <AlbumCard
                        key={album.AlbumID}
                        id={album.AlbumID.toString()}
                        title={album.AlbumName}
                        artist={`${album.ArtistFirstName} ${album.ArtistLastName}`}
                        imageUrl=""
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'songs' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">All Songs in {genre.GenreName}</h3>
              {songs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No songs found in this genre.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {songs.map((song) => (
                    <SongCard
                      key={song.SongID}
                      id={song.SongID.toString()}
                      title={song.SongName}
                      artist={`${song.ArtistFirstName} ${song.ArtistLastName}`}
                      imageUrl={song.FilePath ? getFileUrl(song.FilePath) : ''}
                      listenCount={song.ListenCount}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'albums' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">All Albums in {genre.GenreName}</h3>
              {albums.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No albums found in this genre.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {albums.map((album) => (
                    <AlbumCard
                      key={album.AlbumID}
                      id={album.AlbumID.toString()}
                      title={album.AlbumName}
                      artist={`${album.ArtistFirstName} ${album.ArtistLastName}`}
                      imageUrl=""
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};