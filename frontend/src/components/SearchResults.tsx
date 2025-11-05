import React from 'react';
import { SearchResultItem } from './SearchResultItem';
import type { SearchResult, ArtistSearchResult, AlbumSearchResult, SongSearchResult, PlaylistSearchResult } from './SearchResultItem';

interface SearchResultsData {
  query: string;
  results: {
    artists: ArtistSearchResult[];
    albums: AlbumSearchResult[];
    songs: SongSearchResult[];
    playlists: PlaylistSearchResult[];
  };
  totalResults: number;
}

interface SearchResultsProps {
  searchData: SearchResultsData | null;
  isLoading: boolean;
  isVisible: boolean;
  onResultClick: (result: SearchResult) => void;
  onClose: () => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  searchData,
  isLoading,
  isVisible,
  onResultClick,
  onClose
}) => {
  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 mt-1 max-h-96 overflow-y-auto z-50">
      {isLoading ? (
        <div className="p-4 text-center">
          <div className="inline-flex items-center space-x-2">
            <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-600">Searching...</span>
          </div>
        </div>
      ) : !searchData || searchData.totalResults === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p>No results found</p>
          {searchData && (
            <p className="text-sm">Try searching for different keywords</p>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {/* Header with total results */}
          <div className="p-3 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Found {searchData.totalResults} result{searchData.totalResults !== 1 ? 's' : ''} for "{searchData.query}"
              </p>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Artists Section */}
          {searchData.results.artists.length > 0 && (
            <div>
              <div className="p-2 bg-gray-25">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Artists ({searchData.results.artists.length})
                </h3>
              </div>
              {searchData.results.artists.map((artist) => (
                <SearchResultItem
                  key={`artist-${artist.ArtistID}`}
                  result={artist}
                  query={searchData.query}
                  onClick={() => onResultClick(artist)}
                />
              ))}
            </div>
          )}

          {/* Albums Section */}
          {searchData.results.albums.length > 0 && (
            <div>
              <div className="p-2 bg-gray-25">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm0 6h6v2H7v-2z" clipRule="evenodd" />
                  </svg>
                  Albums ({searchData.results.albums.length})
                </h3>
              </div>
              {searchData.results.albums.map((album) => (
                <SearchResultItem
                  key={`album-${album.AlbumID}`}
                  result={album}
                  query={searchData.query}
                  onClick={() => onResultClick(album)}
                />
              ))}
            </div>
          )}

          {/* Songs Section */}
          {searchData.results.songs.length > 0 && (
            <div>
              <div className="p-2 bg-gray-25">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" clipRule="evenodd" />
                  </svg>
                  Songs ({searchData.results.songs.length})
                </h3>
              </div>
              {searchData.results.songs.map((song) => (
                <SearchResultItem
                  key={`song-${song.SongID}`}
                  result={song}
                  query={searchData.query}
                  onClick={() => onResultClick(song)}
                />
              ))}
            </div>
          )}

          {/* Playlists Section */}
          {searchData.results.playlists.length > 0 && (
            <div>
              <div className="p-2 bg-gray-25">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Playlists ({searchData.results.playlists.length})
                </h3>
              </div>
              {searchData.results.playlists.map((playlist) => (
                <SearchResultItem
                  key={`playlist-${playlist.PlaylistID}`}
                  result={playlist}
                  query={searchData.query}
                  onClick={() => onResultClick(playlist)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};