import React from 'react';
import { TextHighlight } from './TextHighlight';
import { getFileUrl } from '../services/api';

// Define types for search results based on the backend response
export interface ArtistSearchResult {
  ArtistID: number;
  FirstName: string;
  LastName: string;
  Username: string;
  ProfilePicture?: string;
  VerifiedStatus: number;
  type: 'artist';
}

export interface AlbumSearchResult {
  AlbumID: number;
  AlbumName: string;
  AlbumCover?: string;
  ReleaseDate: string;
  ArtistFirstName: string;
  ArtistLastName: string;
  ArtistUsername: string;
  type: 'album';
}

export interface SongSearchResult {
  SongID: number;
  SongName: string;
  FilePath?: string;
  Duration: number;
  ListenCount: number;
  ArtistFirstName: string;
  ArtistLastName: string;
  ArtistUsername: string;
  AlbumName?: string;
  AlbumCover?: string;
  type: 'song';
}

export interface PlaylistSearchResult {
  PlaylistID: number;
  PlaylistName: string;
  Description?: string;
  CreatedAt: string;
  CreatorFirstName: string;
  CreatorLastName: string;
  CreatorUsername: string;
  type: 'playlist';
}

export type SearchResult = ArtistSearchResult | AlbumSearchResult | SongSearchResult | PlaylistSearchResult;

interface SearchResultItemProps {
  result: SearchResult;
  query: string;
  onClick: () => void;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  query,
  onClick
}) => {
  const getImageUrl = () => {
    switch (result.type) {
      case 'artist':
        return result.ProfilePicture 
          ? getFileUrl(`profile-pictures/${result.ProfilePicture}`)
          : getFileUrl('profile-pictures/default.jpg');
      case 'album':
        return result.AlbumCover 
          ? getFileUrl(`album-covers/${result.AlbumCover}`)
          : getFileUrl('profile-pictures/default.jpg');
      case 'song':
        return result.AlbumCover 
          ? getFileUrl(`album-covers/${result.AlbumCover}`)
          : getFileUrl('profile-pictures/default.jpg');
      case 'playlist':
        return getFileUrl('profile-pictures/default.jpg');
      default:
        return getFileUrl('profile-pictures/default.jpg');
    }
  };

  const getTypeIcon = () => {
    switch (result.type) {
      case 'artist':
        return (
          <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        );
      case 'album':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm0 6h6v2H7v-2z" clipRule="evenodd" />
          </svg>
        );
      case 'song':
        return (
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" clipRule="evenodd" />
          </svg>
        );
      case 'playlist':
        return (
          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getTitle = () => {
    switch (result.type) {
      case 'artist':
        return `${result.FirstName} ${result.LastName}`;
      case 'album':
        return result.AlbumName;
      case 'song':
        return result.SongName;
      case 'playlist':
        return result.PlaylistName;
    }
  };

  const getSubtitle = () => {
    switch (result.type) {
      case 'artist':
        return `@${result.Username}`;
      case 'album':
        return `by ${result.ArtistFirstName} ${result.ArtistLastName}`;
      case 'song':
        return `by ${result.ArtistFirstName} ${result.ArtistLastName}${result.AlbumName ? ` • ${result.AlbumName}` : ''}`;
      case 'playlist':
        return `by ${result.CreatorFirstName} ${result.CreatorLastName}`;
    }
  };

  const getTypeLabel = () => {
    return result.type.charAt(0).toUpperCase() + result.type.slice(1);
  };

  return (
    <div
      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
      onClick={onClick}
    >
      {/* Image */}
      <div className="flex-shrink-0 w-12 h-12 mr-3">
        <img
          src={getImageUrl()}
          alt={getTitle()}
          className="w-full h-full object-cover rounded-lg bg-gray-200"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getFileUrl('profile-pictures/default.jpg');
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {getTypeIcon()}
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {getTypeLabel()}
          </span>
          {result.type === 'artist' && result.VerifiedStatus === 1 && (
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <h3 className="font-medium text-gray-900 truncate">
          <TextHighlight text={getTitle()} query={query} />
        </h3>
        <p className="text-sm text-gray-600 truncate">
          {getSubtitle()}
        </p>
      </div>

      {/* Arrow indicator */}
      <div className="flex-shrink-0 ml-2">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};