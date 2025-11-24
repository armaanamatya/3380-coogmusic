import React, { useEffect, useMemo, useState } from 'react';
import { getFileUrl } from '../services/api';

const PAGE_SIZE = 20;
const ARTIST_PAGE_SIZE = 10;
const ALBUM_PAGE_SIZE = 10;
const PLAYLIST_PAGE_SIZE = 6;
const SONG_PAGE_SIZE = 10;
const LISTEN_HISTORY_PAGE_SIZE = 15;

type PageInfo = {
  currentPage: number;
  pageCount: number;
  total: number;
  start: number;
  end: number;
};

type PaginationControlsProps = {
  pageInfo: PageInfo;
  onPageChange: (page: number) => void;
  className?: string;
};

const PaginationControls: React.FC<PaginationControlsProps> = ({ pageInfo, onPageChange, className = '' }) => {
  const { currentPage, pageCount, total, start, end } = pageInfo;
  const showingStart = total === 0 ? 0 : start + 1;
  const showingEnd = total === 0 ? 0 : end;

  return (
    <div
      className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-600 ${className}`}
    >
      <span className="whitespace-nowrap">
        Showing {showingStart} to {showingEnd} of {total} result{total === 1 ? '' : 's'}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className={`px-3 py-1 rounded border text-xs font-semibold ${
            currentPage === 0
              ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-100'
          }`}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= pageCount - 1}
          className={`px-3 py-1 rounded border text-xs font-semibold ${
            currentPage >= pageCount - 1
              ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-100'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

type AnalyticsReportViewMode =
  | 'summary'
  | 'userReport'
  | 'artistActivity'
  | 'albumActivity'
  | 'playlistActivity'
  | 'songActivity';

interface AnalyticsExpandedProps {
  reportData: any;
  onClose: () => void;
  isIndividualUser: boolean;
  includeListeners: boolean;
  includeArtists: boolean;
  includePlaylistStatistics: boolean;
  includeAlbumStatistics: boolean;
  includeGeographics: boolean;
}

export const AnalyticsExpanded: React.FC<AnalyticsExpandedProps> = ({
  reportData,
  onClose,
  isIndividualUser,
  includeListeners,
  includeArtists,
  includePlaylistStatistics,
  includeAlbumStatistics,
  includeGeographics
}) => {
  const showSongStats = reportData?.showSongStats !== false;
  const showArtistStats = reportData?.showArtistStats !== false;
  const showAgeDemographics = reportData?.showAgeDemographics !== false;
  const [viewMode, setViewMode] = useState<AnalyticsReportViewMode>('summary');
  const [expandedFollowerKeys, setExpandedFollowerKeys] = useState<Record<string, boolean>>({});
  const [followerColumnToggles, setFollowerColumnToggles] = useState({
    showSongListens: false,
    showSongLikes: false,
    showListenDuration: false,
    showAlbumLikes: false
  });
  const [followerSortOptions, setFollowerSortOptions] = useState<Record<string, string>>({});
  const [listenerDobRange, setListenerDobRange] = useState({ start: '', end: '' });
  const [artistDobRange, setArtistDobRange] = useState({ start: '', end: '' });
  const [listenerCountryFilter, setListenerCountryFilter] = useState<string>('All Countries');
  const [listenerCityFilter, setListenerCityFilter] = useState<string>('All Cities');
  const [artistCountryFilter, setArtistCountryFilter] = useState<string>('All Countries');
  const [artistCityFilter, setArtistCityFilter] = useState<string>('All Cities');
  const [userActivityColumns, setUserActivityColumns] = useState({
    showEmail: false,
    showCountry: false,
    showCity: false
  });
  const [userActivityFilters, setUserActivityFilters] = useState({
    songsPlayedUnder: '',
    songsPlayedOver: '',
    songsLikedUnder: '',
    songsLikedOver: '',
    artistsFollowedUnder: '',
    artistsFollowedOver: '',
    playlistsCreatedUnder: '',
    playlistsCreatedOver: '',
    albumsLikedUnder: '',
    albumsLikedOver: ''
  });
  const [artistActivityFilters, setArtistActivityFilters] = useState({
    songsReleasedUnder: '',
    songsReleasedOver: '',
    albumsReleasedUnder: '',
    albumsReleasedOver: ''
  });
  const [aggregateArtistActivityFilters, setAggregateArtistActivityFilters] = useState({
    songsReleasedUnder: '',
    songsReleasedOver: '',
    albumsReleasedUnder: '',
    albumsReleasedOver: '',
    totalListensUnder: '',
    totalListensOver: '',
    songLikesUnder: '',
    songLikesOver: '',
    albumLikesUnder: '',
    albumLikesOver: '',
    totalListenDurationUnder: '',
    totalListenDurationOver: '',
    ageUnder: '',
    ageOver: '',
    country: 'All Countries',
    city: 'All Cities',
    selectedGenres: [] as string[]
  });
  const [aggregateArtistActivitySort, setAggregateArtistActivitySort] = useState<string>('username-asc');
  const [playlistActivityFilters, setPlaylistActivityFilters] = useState({
    playlistType: 'All',
    username: '',
    likesUnder: '',
    likesOver: '',
    songsUnder: '',
    songsOver: '',
    durationUnder: '',
    durationOver: ''
  });
  const [albumActivityFilters, setAlbumActivityFilters] = useState({
    genre: '',
    username: '',
    totalListensUnder: '',
    totalListensOver: '',
    totalLikesUnder: '',
    totalLikesOver: '',
    totalLengthUnder: '',
    totalLengthOver: '',
    songsUnder: '',
    songsOver: ''
  });
  const [songActivityFilters, setSongActivityFilters] = useState({
    artistUsername: '',
    likesFilter: 'All' as 'Likes' | 'No Likes' | 'All',
    totalListensUnder: '',
    totalListensOver: '',
    totalLikesUnder: '',
    totalLikesOver: '',
    averageListenDurationUnder: '',
    averageListenDurationOver: '',
    totalListenDurationUnder: '',
    totalListenDurationOver: '',
    songLengthUnder: '',
    songLengthOver: '',
    selectedGenres: [] as string[],
    verified: 'All' as 'Verified' | 'Not Verified' | 'All'
  });
  const [listenerActivitySort, setListenerActivitySort] = useState<string>('username-asc');
  const [artistActivitySort, setArtistActivitySort] = useState<string>('username-asc');
  const [albumActivitySort, setAlbumActivitySort] = useState<string>('username-asc');
  const [playlistActivitySort, setPlaylistActivitySort] = useState<string>('playlistName-asc');
  const [songActivitySort, setSongActivitySort] = useState<string>('songName-asc');
  const [individualListenerSongActivitySort, setIndividualListenerSongActivitySort] = useState<string>('artistUsername-asc');
  const [expandedSummaryCharts, setExpandedSummaryCharts] = useState<{ country: boolean; age: boolean }>({
    country: false,
    age: false
  });
  
  const [expandedSparklines, setExpandedSparklines] = useState<{ total: boolean; listeners: boolean; artists: boolean }>({
    total: true,
    listeners: true,
    artists: true
  });
  const countryChartData = useMemo(() => {
    if (!Array.isArray(reportData.countryStats) || reportData.countryStats.length === 0) {
      return null;
    }
    const rows = [...reportData.countryStats]
      .map((entry: any) => ({
        country: entry.country || 'Unknown',
        count: Number(entry.count ?? 0),
        ratio: entry.ratio
      }))
      .filter((entry) => entry.count > 0);
    if (!rows.length) {
      return null;
    }
    const sorted = rows.sort((a, b) => b.count - a.count);
    const maxCount = sorted.reduce((max, entry) => Math.max(max, entry.count), 0);
    return { rows: sorted, maxCount };
  }, [reportData.countryStats]);
  const ageHistogramData = useMemo(() => {
    if (!Array.isArray(reportData.ageDemographics) || reportData.ageDemographics.length === 0) {
      return null;
    }
    const rows = [...reportData.ageDemographics]
      .map((entry: any) => ({
        range: entry.range || 'Unknown',
        count: Number(entry.count ?? 0),
        ratio: entry.ratio
      }))
      .filter((entry) => entry.count > 0);
    if (!rows.length) {
      return null;
    }
    const parseRangeStart = (range: string) => {
      if (!range) return Number.POSITIVE_INFINITY;
      const numericMatch = range.match(/(\d+)/);
      if (numericMatch) {
        return Number(numericMatch[1]);
      }
      if (range.toLowerCase().includes('under')) {
        return 0;
      }
      if (range.toLowerCase().includes('over')) {
        return Number.POSITIVE_INFINITY;
      }
      return Number.POSITIVE_INFINITY;
    };

    const sorted = rows.sort((a, b) => {
      const startA = parseRangeStart(a.range);
      const startB = parseRangeStart(b.range);
      if (startA === startB) {
        return a.range.localeCompare(b.range);
      }
      return startA - startB;
    });
    const maxCount = sorted.reduce((max, entry) => Math.max(max, entry.count), 0);
    return { rows: sorted, maxCount };
  }, [reportData.ageDemographics]);
  const [expandedSongListeners, setExpandedSongListeners] = useState<Record<string, boolean>>({});
  const [songListenerColumnVisibility, setSongListenerColumnVisibility] = useState<Record<string, { showAvgDuration: boolean; showTotalDuration: boolean }>>({});
  const [expandedAlbumSections, setExpandedAlbumSections] = useState<Record<string, { songs: boolean; liked: boolean }>>({});
  const [expandedPlaylistSections, setExpandedPlaylistSections] = useState<
    Record<string, { songs: boolean; liked: boolean }>
  >({});
  const [playlistSongsSortOptions, setPlaylistSongsSortOptions] = useState<Record<string, string>>({});
  const [playlistLikedUsersSortOptions, setPlaylistLikedUsersSortOptions] = useState<Record<string, string>>({});
  const [albumSongsSortOptions, setAlbumSongsSortOptions] = useState<Record<string, string>>({});
  const [albumLikedUsersSortOptions, setAlbumLikedUsersSortOptions] = useState<Record<string, string>>({});
  const [songListenerSortOptions, setSongListenerSortOptions] = useState<Record<string, string>>({});

  const [paginationPages, setPaginationPages] = useState<Record<string, number>>({});
  const [listenHistorySort, setListenHistorySort] = useState<Record<string, string>>({});
  const [expandedListenHistory, setExpandedListenHistory] = useState<Record<string, boolean>>({});
  const [expandedAlbumLikedSongs, setExpandedAlbumLikedSongs] = useState<Record<string, boolean>>({});
  const [songFilters, setSongFilters] = useState({
    selectedGenres: [] as string[],
    selectedArtists: [] as string[],
    songLengthUnder: '',
    songLengthOver: '',
    totalListensUnder: '',
    totalListensOver: '',
    averageListenDurationUnder: '',
    averageListenDurationOver: '',
    totalListenDurationUnder: '',
    totalListenDurationOver: '',
    liked: 'All',
    verified: 'All' as 'Verified' | 'Not Verified' | 'All'
  });
  const [artistFilters, setArtistFilters] = useState({
    verified: 'All',
    selectedCountries: [] as string[],
    selectedCities: [] as string[],
    songsLikedUnder: '',
    songsLikedOver: '',
    songsListenedUnder: '',
    songsListenedOver: '',
    albumsLikedUnder: '',
    albumsLikedOver: '',
    totalListenTimeUnder: '',
    totalListenTimeOver: ''
  });

  // State for filter visibility (only for all users analytics)
  const [showListenerActivityFilters, setShowListenerActivityFilters] = useState(false);
  const [showArtistActivitySummaryFilters, setShowArtistActivitySummaryFilters] = useState(false);
  const [showArtistActivityFilters, setShowArtistActivityFilters] = useState(false);
  const [showAlbumActivityFilters, setShowAlbumActivityFilters] = useState(false);
  const [showPlaylistActivityFilters, setShowPlaylistActivityFilters] = useState(false);
  const [showSongActivityFilters, setShowSongActivityFilters] = useState(false);
  const [showIndividualSongFilters, setShowIndividualSongFilters] = useState(false);
  const [showIndividualArtistFilters, setShowIndividualArtistFilters] = useState(false);
  const [showIndividualAlbumFilters, setShowIndividualAlbumFilters] = useState(false);
  const [showIndividualPlaylistFilters, setShowIndividualPlaylistFilters] = useState(false);
  
  const [individualListenerPlaylistFilters, setIndividualListenerPlaylistFilters] = useState({
    playlistType: 'All' as 'Public' | 'Private' | 'All',
    songsUnder: '',
    songsOver: '',
    totalDurationUnder: '',
    totalDurationOver: '',
    likesUnder: '',
    likesOver: ''
  });
  
  const [individualListenerAlbumFilters, setIndividualListenerAlbumFilters] = useState({
    selectedArtists: [] as string[],
    listenTimeUnder: '',
    listenTimeOver: '',
    verified: 'All' as 'Verified' | 'Not Verified' | 'All'
  });
  
  const [individualListenerAlbumActivitySort, setIndividualListenerAlbumActivitySort] = useState<string>('albumName-asc');
  const [individualListenerPlaylistActivitySort, setIndividualListenerPlaylistActivitySort] = useState<string>('playlistName-asc');

  const getPageInfo = (key: string, total: number, pageSize = PAGE_SIZE): PageInfo => {
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const rawPage = paginationPages[key] ?? 0;
    const currentPage = Math.min(Math.max(0, rawPage), pageCount - 1);
    const start = currentPage * pageSize;
    const end = Math.min(start + pageSize, total);
    return { currentPage, pageCount, total, start, end };
  };

  const getPaginatedList = <T,>(items: T[], key: string, pageSize = PAGE_SIZE) => {
    const pageInfo = getPageInfo(key, items.length, pageSize);
    return {
      pageInfo,
      items: items.slice(pageInfo.start, pageInfo.end)
    };
  };

  const setPageForKey = (key: string, targetPage: number, pageCount: number) => {
    const normalizedPage = Math.min(Math.max(0, targetPage), Math.max(pageCount - 1, 0));
    setPaginationPages((prev) => ({
      ...prev,
      [key]: normalizedPage
    }));
  };

  const getPageClass = (mode: AnalyticsReportViewMode, isSummary = false) => {
    const classes = ['analytics-report-page'];
    if (viewMode !== mode) {
      classes.push('hidden');
    }
    classes.push('print-visible');
    if (!isSummary && !isIndividualUser) {
      classes.push('print-break-before');
    }
    return classes.join(' ');
  };

  // Helper function to format seconds to readable time
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const renderAlbumActivity = () => {
    if (isIndividualUser) {
      const userType = reportData.userDetails?.userType;
      if (!availableAlbumActivity) {
        return (
          <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
            No album activity recorded for the selected period.
          </div>
        );
      }
      if (userType === 'Listener') {
        return renderIndividualListenerAlbumActivity();
      }
      if (userType === 'Artist') {
        return renderIndividualArtistAlbumActivity();
      }
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          Album activity is unavailable for this account type.
        </div>
      );
    }

    if (showArtistStats === false || !includeAlbumStatistics) {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          Album activity reporting is disabled for this export.
        </div>
      );
    }

    if (!availableAlbumActivity) {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          No album activity recorded for the selected period.
        </div>
      );
    }

    // Helper function to parse HHMMSS format to seconds
    const parseAlbumDurationToSeconds = (timeStr: string): number => {
      if (!timeStr || !timeStr.trim()) return 0;
      const digitsOnly = timeStr.trim().replace(/\D/g, '');
      if (digitsOnly.length === 0) return 0;
      const padded = digitsOnly.padStart(6, '0');
      const hours = parseInt(padded.substring(0, 2), 10) || 0;
      const minutes = parseInt(padded.substring(2, 4), 10) || 0;
      const seconds = parseInt(padded.substring(4, 6), 10) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    };
    
    // Get unique genres for filter dropdown
    const uniqueGenres = Array.from(
      new Set(
        (reportData.albumActivity || [])
          .map((album: any) => album.genre)
          .filter((genre: any) => genre && String(genre).trim())
      )
    )
      .map((genre) => String(genre))
      .sort();
    
    // Filter albums
    const filteredAlbums = [...reportData.albumActivity].filter((album: any) => {
      // Genre filter
      if (albumActivityFilters.genre && album.genre !== albumActivityFilters.genre) {
        return false;
      }
      
      // Username filter
      if (albumActivityFilters.username) {
        const searchTerm = albumActivityFilters.username.toLowerCase();
        const artistUsername = (album.artistUsername || '').toLowerCase();
        if (!artistUsername.includes(searchTerm)) {
          return false;
        }
      }
      
      // Total Listens Under filter
      if (albumActivityFilters.totalListensUnder) {
        const threshold = Number(albumActivityFilters.totalListensUnder);
        const listens = Number(album.listens || 0);
        if (!Number.isNaN(threshold) && listens >= threshold) {
          return false;
        }
      }
      
      // Total Listens Over filter
      if (albumActivityFilters.totalListensOver) {
        const threshold = Number(albumActivityFilters.totalListensOver);
        const listens = Number(album.listens || 0);
        if (!Number.isNaN(threshold) && listens <= threshold) {
          return false;
        }
      }
      
      // Total Likes Under filter
      if (albumActivityFilters.totalLikesUnder) {
        const threshold = Number(albumActivityFilters.totalLikesUnder);
        const likes = Number(album.likes || 0);
        if (!Number.isNaN(threshold) && likes >= threshold) {
          return false;
        }
      }
      
      // Total Likes Over filter
      if (albumActivityFilters.totalLikesOver) {
        const threshold = Number(albumActivityFilters.totalLikesOver);
        const likes = Number(album.likes || 0);
        if (!Number.isNaN(threshold) && likes <= threshold) {
          return false;
        }
      }
      
      // Total Length Under filter
      if (albumActivityFilters.totalLengthUnder) {
        const thresholdSeconds = parseAlbumDurationToSeconds(albumActivityFilters.totalLengthUnder);
        const albumDurationSeconds = Number(album.totalDuration || 0);
        if (thresholdSeconds > 0 && albumDurationSeconds >= thresholdSeconds) {
          return false;
        }
      }
      
      // Total Length Over filter
      if (albumActivityFilters.totalLengthOver) {
        const thresholdSeconds = parseAlbumDurationToSeconds(albumActivityFilters.totalLengthOver);
        const albumDurationSeconds = Number(album.totalDuration || 0);
        if (thresholdSeconds > 0 && albumDurationSeconds <= thresholdSeconds) {
          return false;
        }
      }
      
      // Songs Under filter
      if (albumActivityFilters.songsUnder) {
        const threshold = Number(albumActivityFilters.songsUnder);
        const songCount = Number(Array.isArray(album.songs) ? album.songs.length : album.songCount || 0);
        if (!Number.isNaN(threshold) && songCount >= threshold) {
          return false;
        }
      }
      
      // Songs Over filter
      if (albumActivityFilters.songsOver) {
        const threshold = Number(albumActivityFilters.songsOver);
        const songCount = Number(Array.isArray(album.songs) ? album.songs.length : album.songCount || 0);
        if (!Number.isNaN(threshold) && songCount <= threshold) {
          return false;
        }
      }
      
      return true;
    });
    
    // Sort filtered albums
    const albums = [...filteredAlbums].sort((a: any, b: any) => {
      const sortOption = albumActivitySort;
      
      if (sortOption === 'username-asc') {
        return (a.artistUsername || '').toLowerCase().localeCompare((b.artistUsername || '').toLowerCase());
      } else if (sortOption === 'username-desc') {
        return (b.artistUsername || '').toLowerCase().localeCompare((a.artistUsername || '').toLowerCase());
      } else if (sortOption === 'albumName-asc') {
        return (a.albumName || '').toLowerCase().localeCompare((b.albumName || '').toLowerCase());
      } else if (sortOption === 'albumName-desc') {
        return (b.albumName || '').toLowerCase().localeCompare((a.albumName || '').toLowerCase());
      } else if (sortOption === 'totalListens-asc') {
        return Number(a.listens || 0) - Number(b.listens || 0);
      } else if (sortOption === 'totalListens-desc') {
        return Number(b.listens || 0) - Number(a.listens || 0);
      } else if (sortOption === 'totalLikes-asc') {
        return Number(a.likes || 0) - Number(b.likes || 0);
      } else if (sortOption === 'totalLikes-desc') {
        return Number(b.likes || 0) - Number(a.likes || 0);
      } else if (sortOption === 'totalLength-asc') {
        return Number(a.totalDuration || 0) - Number(b.totalDuration || 0);
      } else if (sortOption === 'totalLength-desc') {
        return Number(b.totalDuration || 0) - Number(a.totalDuration || 0);
      } else if (sortOption === 'songs-asc') {
        const songsA = Array.isArray(a.songs) ? a.songs.length : (a.songCount || 0);
        const songsB = Array.isArray(b.songs) ? b.songs.length : (b.songCount || 0);
        return Number(songsA) - Number(songsB);
      } else if (sortOption === 'songs-desc') {
        const songsA = Array.isArray(a.songs) ? a.songs.length : (a.songCount || 0);
        const songsB = Array.isArray(b.songs) ? b.songs.length : (b.songCount || 0);
        return Number(songsB) - Number(songsA);
      } else if (sortOption === 'dateJoined-asc') {
        const dateA = a.artistDateJoined ? new Date(a.artistDateJoined).getTime() : 0;
        const dateB = b.artistDateJoined ? new Date(b.artistDateJoined).getTime() : 0;
        return dateA - dateB;
      } else if (sortOption === 'dateJoined-desc') {
        const dateA = a.artistDateJoined ? new Date(a.artistDateJoined).getTime() : 0;
        const dateB = b.artistDateJoined ? new Date(b.artistDateJoined).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });
    const { items: pagedAlbums, pageInfo: albumPageInfo } = getPaginatedList(
      albums,
      'albumActivity',
      ALBUM_PAGE_SIZE
    );

    return (
      <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Album Activity</h3>
              <p className="text-xs text-gray-600">Performance details for albums released in the selected period</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAlbumActivityFilters(!showAlbumActivityFilters)}
              className="px-3 py-1 text-xs font-semibold rounded-full border border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              {showAlbumActivityFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>
        
        {/* Album Activity Filters */}
        {showAlbumActivityFilters && (
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-4">
          <h5 className="text-xs font-semibold text-gray-700 mb-3">Filters</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Genre */}
            <div>
              <label htmlFor="filter-album-genre" className="block text-xs font-medium text-gray-600 mb-1">
                Genre:
              </label>
              <select
                id="filter-album-genre"
                value={albumActivityFilters.genre}
                onChange={(e) => {
                  setAlbumActivityFilters((prev) => ({ ...prev, genre: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'albumActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">All Genres</option>
                {uniqueGenres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="filter-album-username" className="block text-xs font-medium text-gray-600 mb-1">
                Username:
              </label>
              <input
                type="text"
                id="filter-album-username"
                value={albumActivityFilters.username}
                onChange={(e) => {
                  setAlbumActivityFilters((prev) => ({ ...prev, username: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'albumActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter username"
              />
            </div>

            {/* Total Listens Under */}
            <div>
              <label htmlFor="filter-album-total-listens-under" className="block text-xs font-medium text-gray-600 mb-1">
                Total Listens Under:
              </label>
              <input
                type="number"
                id="filter-album-total-listens-under"
                min="0"
                value={albumActivityFilters.totalListensUnder}
                onChange={(e) => {
                  setAlbumActivityFilters((prev) => ({ ...prev, totalListensUnder: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'albumActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Total Listens Over */}
            <div>
              <label htmlFor="filter-album-total-listens-over" className="block text-xs font-medium text-gray-600 mb-1">
                Total Listens Over:
              </label>
              <input
                type="number"
                id="filter-album-total-listens-over"
                min="0"
                value={albumActivityFilters.totalListensOver}
                onChange={(e) => {
                  setAlbumActivityFilters((prev) => ({ ...prev, totalListensOver: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'albumActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Total Likes Under */}
            <div>
              <label htmlFor="filter-album-total-likes-under" className="block text-xs font-medium text-gray-600 mb-1">
                Total Likes Under:
              </label>
              <input
                type="number"
                id="filter-album-total-likes-under"
                min="0"
                value={albumActivityFilters.totalLikesUnder}
                onChange={(e) => {
                  setAlbumActivityFilters((prev) => ({ ...prev, totalLikesUnder: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'albumActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Total Likes Over */}
            <div>
              <label htmlFor="filter-album-total-likes-over" className="block text-xs font-medium text-gray-600 mb-1">
                Total Likes Over:
              </label>
              <input
                type="number"
                id="filter-album-total-likes-over"
                min="0"
                value={albumActivityFilters.totalLikesOver}
                onChange={(e) => {
                  setAlbumActivityFilters((prev) => ({ ...prev, totalLikesOver: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'albumActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Total Length Under */}
            <div>
              <label htmlFor="filter-album-total-length-under" className="block text-xs font-medium text-gray-600 mb-1">
                Total Length Under:
              </label>
              <input
                type="text"
                id="filter-album-total-length-under"
                value={(() => {
                  const raw = albumActivityFilters.totalLengthUnder;
                  if (!raw) return '';
                  if (raw.length <= 2) return raw;
                  if (raw.length <= 4) {
                    const hh = raw.substring(0, 2);
                    const mm = raw.substring(2);
                    return `${hh}:${mm}`;
                  }
                  const hh = raw.substring(0, 2);
                  const mm = raw.substring(2, 4);
                  const ss = raw.substring(4);
                  return `${hh}:${mm}:${ss}`;
                })()}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setAlbumActivityFilters((prev) => ({ ...prev, totalLengthUnder: raw }));
                  setPaginationPages((prev) => ({ ...prev, 'albumActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="HH:MM:SS"
                maxLength={8}
              />
            </div>

            {/* Total Length Over */}
            <div>
              <label htmlFor="filter-album-total-length-over" className="block text-xs font-medium text-gray-600 mb-1">
                Total Length Over:
              </label>
              <input
                type="text"
                id="filter-album-total-length-over"
                value={(() => {
                  const raw = albumActivityFilters.totalLengthOver;
                  if (!raw) return '';
                  if (raw.length <= 2) return raw;
                  if (raw.length <= 4) {
                    const hh = raw.substring(0, 2);
                    const mm = raw.substring(2);
                    return `${hh}:${mm}`;
                  }
                  const hh = raw.substring(0, 2);
                  const mm = raw.substring(2, 4);
                  const ss = raw.substring(4);
                  return `${hh}:${mm}:${ss}`;
                })()}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setAlbumActivityFilters((prev) => ({ ...prev, totalLengthOver: raw }));
                  setPaginationPages((prev) => ({ ...prev, 'albumActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="HH:MM:SS"
                maxLength={8}
              />
            </div>

            {/* Songs Under */}
            <div>
              <label htmlFor="filter-album-songs-under" className="block text-xs font-medium text-gray-600 mb-1">
                Songs Under:
              </label>
              <input
                type="number"
                id="filter-album-songs-under"
                min="0"
                value={albumActivityFilters.songsUnder}
                onChange={(e) => {
                  setAlbumActivityFilters((prev) => ({ ...prev, songsUnder: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'albumActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Songs Over */}
            <div>
              <label htmlFor="filter-album-songs-over" className="block text-xs font-medium text-gray-600 mb-1">
                Songs Over:
              </label>
              <input
                type="number"
                id="filter-album-songs-over"
                min="0"
                value={albumActivityFilters.songsOver}
                onChange={(e) => {
                  setAlbumActivityFilters((prev) => ({ ...prev, songsOver: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'albumActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>
          </div>
        </div>
        )}
        
        {/* Album Activity Sort */}
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
          <div className="flex items-center gap-3">
            <label htmlFor="album-activity-sort" className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Sort by:
            </label>
            <select
              id="album-activity-sort"
              value={albumActivitySort}
              onChange={(e) => {
                setAlbumActivitySort(e.target.value);
                setPaginationPages((prev) => ({ ...prev, 'albumActivity': 0 }));
              }}
              className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="username-asc">Username (A-Z)</option>
              <option value="username-desc">Username (Z-A)</option>
              <option value="albumName-asc">Album Name (A-Z)</option>
              <option value="albumName-desc">Album Name (Z-A)</option>
              <option value="totalListens-asc">Total Listens (Low to High)</option>
              <option value="totalListens-desc">Total Listens (High to Low)</option>
              <option value="totalLikes-asc">Total Likes (Low to High)</option>
              <option value="totalLikes-desc">Total Likes (High to Low)</option>
              <option value="totalLength-asc">Total Length (Shortest to Longest)</option>
              <option value="totalLength-desc">Total Length (Longest to Shortest)</option>
              <option value="songs-asc">Songs (Low to High)</option>
              <option value="songs-desc">Songs (High to Low)</option>
              <option value="dateJoined-asc">Date Joined (Oldest First)</option>
              <option value="dateJoined-desc">Date Joined (Newest First)</option>
            </select>
          </div>
        </div>
        
        <div className="px-5 py-4 space-y-4">
        {albums.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-lg px-5 py-8 text-center text-sm text-gray-500">
            {reportData.albumActivity && reportData.albumActivity.length > 0
              ? 'No albums match the selected filters.'
              : 'No album activity recorded for the selected period.'}
          </div>
        ) : (
          <>
            {pagedAlbums.map((album: any, idx: number) => {
          const songs = Array.isArray(album.songs) ? album.songs : [];
          const likedBy = Array.isArray(album.likedBy) ? album.likedBy : [];
          const albumKey = `album-${album.albumId ?? idx}`;
          const currentAlbumState = expandedAlbumSections[albumKey] ?? { songs: false, liked: false };
          const songsExpanded = currentAlbumState.songs;
          const likesExpanded = currentAlbumState.liked;
          const toggleAlbumSection = (section: 'songs' | 'liked') => {
            setExpandedAlbumSections((prev) => {
              const prior = prev[albumKey] ?? { songs: false, liked: false };
              return {
                ...prev,
                [albumKey]: {
                  songs: section === 'songs' ? !prior.songs : prior.songs,
                  liked: section === 'liked' ? !prior.liked : prior.liked
                }
              };
            });
          };
          const artistLabel =
            album.artistUsername ||
            album.artistName ||
            'Unknown Artist';

          return (
            <section
              key={`${album.albumId ?? idx}`}
              className="report-section bg-white border border-gray-200 rounded-lg shadow-sm"
            >
              <div className="bg-gray-100 px-5 py-3.5 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 flex flex-wrap items-baseline gap-2">
                    <span>{album.albumName || 'Untitled Album'}</span>
                    <span className="text-sm text-gray-600 font-medium">by {artistLabel}</span>
                  </h3>
                  <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Released: {formatDate(album.releaseDate)}</span>
                    <span>Genre: {album.genre || 'Unknown'}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-5 text-sm text-gray-700">
                  <div className="text-center">
                    <p className="font-semibold text-lg text-gray-900">
                      {formatNumber(album.listens || 0)}
                    </p>
                    <p className="uppercase tracking-wide text-xs text-gray-500">Total Listens</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg text-gray-900">
                      {formatNumber(album.likes || 0)}
                    </p>
                    <p className="uppercase tracking-wide text-xs text-gray-500">Total Likes</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg text-gray-900">
                      {formatTime(Number(album.totalDuration || 0))}
                    </p>
                    <p className="uppercase tracking-wide text-xs text-gray-500">Total Length</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg text-gray-900">
                      {formatNumber(songs.length || album.songCount || 0)}
                    </p>
                    <p className="uppercase tracking-wide text-xs text-gray-500">Songs</p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Songs in this Album
                    </h5>
                    {songs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleAlbumSection('songs')}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        aria-expanded={songsExpanded}
                      >
                        {songsExpanded ? 'Hide songs' : 'Show songs'}
                      </button>
                    )}
                  </div>
                  {songs.length === 0 ? (
                    <div className="border border-dashed border-gray-300 rounded-md px-3 py-4 text-center text-sm text-gray-500">
                      No songs were found for this album in the reporting period.
                    </div>
                  ) : songsExpanded ? (
                    <div className="space-y-3">
                      {/* Songs Sort Dropdown */}
                      <div className="flex items-center gap-3">
                        <label htmlFor={`album-songs-sort-${albumKey}`} className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                          Sort by:
                        </label>
                        <select
                          id={`album-songs-sort-${albumKey}`}
                          value={albumSongsSortOptions[albumKey] || 'songName-asc'}
                          onChange={(e) => {
                            setAlbumSongsSortOptions((prev) => ({ ...prev, [albumKey]: e.target.value }));
                          }}
                          className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <option value="songName-asc">Song Name (A-Z)</option>
                          <option value="songName-desc">Song Name (Z-A)</option>
                          <option value="length-asc">Length (Shortest to Longest)</option>
                          <option value="length-desc">Length (Longest to Shortest)</option>
                          <option value="listens-asc">Listens (Low to High)</option>
                          <option value="listens-desc">Listens (High to Low)</option>
                        </select>
                      </div>
                      
                      {/* Sorted Songs Table */}
                      {(() => {
                        const sortOption = albumSongsSortOptions[albumKey] || 'songName-asc';
                        const sortedSongs = [...songs].sort((a: any, b: any) => {
                          if (sortOption === 'songName-asc') {
                            return (a.songName || '').toLowerCase().localeCompare((b.songName || '').toLowerCase());
                          } else if (sortOption === 'songName-desc') {
                            return (b.songName || '').toLowerCase().localeCompare((a.songName || '').toLowerCase());
                          } else if (sortOption === 'length-asc') {
                            return Number(a.duration || 0) - Number(b.duration || 0);
                          } else if (sortOption === 'length-desc') {
                            return Number(b.duration || 0) - Number(a.duration || 0);
                          } else if (sortOption === 'listens-asc') {
                            return Number(a.listens ?? a.totalListens ?? 0) - Number(b.listens ?? b.totalListens ?? 0);
                          } else if (sortOption === 'listens-desc') {
                            return Number(b.listens ?? b.totalListens ?? 0) - Number(a.listens ?? a.totalListens ?? 0);
                          }
                          return 0;
                        });
                        
                        return (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                              <thead className="bg-white">
                                <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  <th className="px-3.5 py-2.5 text-left">Song Name</th>
                                  <th className="px-3.5 py-2.5 text-left">Length</th>
                                  <th className="px-3.5 py-2.5 text-right">Listens</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {sortedSongs.map((song: any, songIdx: number) => (
                                  <tr
                                    key={`${album.albumId ?? idx}-song-${song.songId ?? songIdx}`}
                                    className={songIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                                  >
                                    <td className="px-3.5 py-2.5 text-sm text-gray-900">{song.songName || 'Unknown Song'}</td>
                                    <td className="px-3.5 py-2.5 text-sm text-gray-900">{formatTime(Number(song.duration || 0))}</td>
                                    <td className="px-3.5 py-2.5 text-sm text-gray-900 text-right">{formatNumber(song.listens ?? song.totalListens ?? 0)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Click “Show songs” to reveal this list.
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Users Who Liked This Album
                    </h5>
                    {likedBy.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleAlbumSection('liked')}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        aria-expanded={likesExpanded}
                      >
                        {likesExpanded ? 'Hide likes' : 'Show likes'}
                      </button>
                    )}
                  </div>
                  {likedBy.length === 0 ? (
                    <div className="border border-dashed border-gray-300 rounded-md px-3 py-4 text-center text-sm text-gray-500">
                      No likes were recorded for this album during the selected period.
                    </div>
                  ) : likesExpanded ? (
                    <div className="space-y-3">
                      {/* Liked Users Sort Dropdown */}
                      <div className="flex items-center gap-3">
                        <label htmlFor={`album-liked-users-sort-${albumKey}`} className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                          Sort by:
                        </label>
                        <select
                          id={`album-liked-users-sort-${albumKey}`}
                          value={albumLikedUsersSortOptions[albumKey] || 'username-asc'}
                          onChange={(e) => {
                            setAlbumLikedUsersSortOptions((prev) => ({ ...prev, [albumKey]: e.target.value }));
                          }}
                          className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <option value="username-asc">Username (A-Z)</option>
                          <option value="username-desc">Username (Z-A)</option>
                          <option value="dateLiked-asc">Date Liked (Oldest First)</option>
                          <option value="dateLiked-desc">Date Liked (Newest First)</option>
                        </select>
                      </div>
                      
                      {/* Sorted Liked Users Table */}
                      {(() => {
                        const sortOption = albumLikedUsersSortOptions[albumKey] || 'username-asc';
                        const sortedLikedBy = [...likedBy].sort((a: any, b: any) => {
                          if (sortOption === 'username-asc') {
                            return (a.username || '').toLowerCase().localeCompare((b.username || '').toLowerCase());
                          } else if (sortOption === 'username-desc') {
                            return (b.username || '').toLowerCase().localeCompare((a.username || '').toLowerCase());
                          } else if (sortOption === 'dateLiked-asc') {
                            const dateA = a.likedAt ? new Date(a.likedAt).getTime() : 0;
                            const dateB = b.likedAt ? new Date(b.likedAt).getTime() : 0;
                            return dateA - dateB;
                          } else if (sortOption === 'dateLiked-desc') {
                            const dateA = a.likedAt ? new Date(a.likedAt).getTime() : 0;
                            const dateB = b.likedAt ? new Date(b.likedAt).getTime() : 0;
                            return dateB - dateA;
                          }
                          return 0;
                        });
                        
                        return (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                              <thead className="bg-white">
                                <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  <th className="px-3.5 py-2.5 text-left">Username</th>
                                  <th className="px-3.5 py-2.5 text-left">Date Liked</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {sortedLikedBy.map((user: any, likeIdx: number) => (
                                  <tr
                                    key={`${album.albumId ?? idx}-liked-${user.userId ?? likeIdx}`}
                                    className={likeIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                                  >
                                    <td className="px-3.5 py-2.5 text-sm text-gray-900">{user.username || 'Unknown'}</td>
                                    <td className="px-3.5 py-2.5 text-sm text-gray-900">{formatDate(user.likedAt)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Click “Show likes” to reveal this list.
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
          </>
        )}
        </div>
        {filteredAlbums.length > 0 && (
          <PaginationControls
            pageInfo={albumPageInfo}
            onPageChange={(page) => setPageForKey('albumActivity', page, albumPageInfo.pageCount)}
            className="mt-4 px-5"
          />
        )}
      </div>
    );
  };

  const renderPlaylistActivity = () => {
    if (isIndividualUser) {
      if (!availablePlaylistActivity) {
        return (
          <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
            No playlist activity recorded for the selected period.
          </div>
        );
      }
      return renderIndividualListenerPlaylistActivity();
    }

    if (!availablePlaylistActivity) {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          No playlist activity recorded for the selected period.
        </div>
      );
    }

    const playlistData = reportData?.playlistActivity ?? {};
    const allPublicPlaylists: any[] = Array.isArray(playlistData.publicPlaylists)
      ? [...playlistData.publicPlaylists]
      : [];
    const allPrivatePlaylists: any[] = Array.isArray(playlistData.privatePlaylists)
      ? [...playlistData.privatePlaylists]
      : [];
    
    // Helper function to parse HHMMSS format to seconds
    const parsePlaylistDurationToSeconds = (timeStr: string): number => {
      if (!timeStr || !timeStr.trim()) return 0;
      const digitsOnly = timeStr.trim().replace(/\D/g, '');
      if (digitsOnly.length === 0) return 0;
      const padded = digitsOnly.padStart(6, '0');
      const hours = parseInt(padded.substring(0, 2), 10) || 0;
      const minutes = parseInt(padded.substring(2, 4), 10) || 0;
      const seconds = parseInt(padded.substring(4, 6), 10) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    };
    
    // Combine all playlists for filtering
    const allPlaylists = [
      ...allPublicPlaylists.map((p: any) => ({ ...p, isPublic: true })),
      ...allPrivatePlaylists.map((p: any) => ({ ...p, isPublic: false }))
    ];
    
    // Filter playlists
    const filteredPlaylists = allPlaylists.filter((playlist: any) => {
      // Playlist type filter
      if (playlistActivityFilters.playlistType === 'Public' && !playlist.isPublic) {
        return false;
      }
      if (playlistActivityFilters.playlistType === 'Private' && playlist.isPublic) {
        return false;
      }
      
      // Username filter
      if (playlistActivityFilters.username) {
        const searchTerm = playlistActivityFilters.username.toLowerCase();
        const ownerUsername = (playlist.ownerUsername || '').toLowerCase();
        if (!ownerUsername.includes(searchTerm)) {
          return false;
        }
      }
      
      // Likes Under filter
      if (playlistActivityFilters.likesUnder) {
        const threshold = Number(playlistActivityFilters.likesUnder);
        const likes = playlist.isPublic 
          ? (playlist.likes != null ? Number(playlist.likes) : (Array.isArray(playlist.likedBy) ? playlist.likedBy.length : 0))
          : 0;
        if (!Number.isNaN(threshold) && likes >= threshold) {
          return false;
        }
      }
      
      // Likes Over filter
      if (playlistActivityFilters.likesOver) {
        const threshold = Number(playlistActivityFilters.likesOver);
        const likes = playlist.isPublic 
          ? (playlist.likes != null ? Number(playlist.likes) : (Array.isArray(playlist.likedBy) ? playlist.likedBy.length : 0))
          : 0;
        if (!Number.isNaN(threshold) && likes <= threshold) {
          return false;
        }
      }
      
      // Songs Under filter
      if (playlistActivityFilters.songsUnder) {
        const threshold = Number(playlistActivityFilters.songsUnder);
        const songCount = Number(playlist.songCount || 0);
        if (!Number.isNaN(threshold) && songCount >= threshold) {
          return false;
        }
      }
      
      // Songs Over filter
      if (playlistActivityFilters.songsOver) {
        const threshold = Number(playlistActivityFilters.songsOver);
        const songCount = Number(playlist.songCount || 0);
        if (!Number.isNaN(threshold) && songCount <= threshold) {
          return false;
        }
      }
      
      // Duration Under filter
      if (playlistActivityFilters.durationUnder) {
        const thresholdSeconds = parsePlaylistDurationToSeconds(playlistActivityFilters.durationUnder);
        const playlistDurationSeconds = Number(playlist.totalDuration || 0);
        if (thresholdSeconds > 0 && playlistDurationSeconds >= thresholdSeconds) {
          return false;
        }
      }
      
      // Duration Over filter
      if (playlistActivityFilters.durationOver) {
        const thresholdSeconds = parsePlaylistDurationToSeconds(playlistActivityFilters.durationOver);
        const playlistDurationSeconds = Number(playlist.totalDuration || 0);
        if (thresholdSeconds > 0 && playlistDurationSeconds <= thresholdSeconds) {
          return false;
        }
      }
      
      return true;
    });
    
    // Separate filtered playlists back into public and private
    const publicPlaylists = filteredPlaylists.filter((p: any) => p.isPublic);
    const privatePlaylists = filteredPlaylists.filter((p: any) => !p.isPublic);

    const renderPlaylistSection = (playlists: any[], title: string, isPublic: boolean) => {
      if (!playlists.length) {
        return (
          <section className="space-y-4">
            <div className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3">
              <h3 className="text-lg font-semibold text-gray-800 uppercase tracking-wide">{title}</h3>
              <p className="text-xs text-gray-600">No playlists found</p>
            </div>
            <div className="border border-dashed border-gray-300 rounded-lg px-5 py-8 text-center text-sm text-gray-500">
              No playlists in this category for the selected period.
            </div>
          </section>
        );
      }

      // Sort playlists
      const sorted = [...playlists].sort((a: any, b: any) => {
        const sortOption = playlistActivitySort;
        
        if (sortOption === 'playlistName-asc') {
          return (a.playlistName || '').toLowerCase().localeCompare((b.playlistName || '').toLowerCase());
        } else if (sortOption === 'playlistName-desc') {
          return (b.playlistName || '').toLowerCase().localeCompare((a.playlistName || '').toLowerCase());
        } else if (sortOption === 'username-asc') {
          return (a.ownerUsername || '').toLowerCase().localeCompare((b.ownerUsername || '').toLowerCase());
        } else if (sortOption === 'username-desc') {
          return (b.ownerUsername || '').toLowerCase().localeCompare((a.ownerUsername || '').toLowerCase());
        } else if (sortOption === 'dateCreated-asc') {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        } else if (sortOption === 'dateCreated-desc') {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        } else if (sortOption === 'songs-asc') {
          return Number(a.songCount || 0) - Number(b.songCount || 0);
        } else if (sortOption === 'songs-desc') {
          return Number(b.songCount || 0) - Number(a.songCount || 0);
        } else if (sortOption === 'totalDuration-asc') {
          return Number(a.totalDuration || 0) - Number(b.totalDuration || 0);
        } else if (sortOption === 'totalDuration-desc') {
          return Number(b.totalDuration || 0) - Number(a.totalDuration || 0);
        } else if (sortOption === 'likes-asc') {
          const likesA = a.isPublic 
            ? (a.likes != null ? Number(a.likes) : (Array.isArray(a.likedBy) ? a.likedBy.length : 0))
            : 0;
          const likesB = b.isPublic 
            ? (b.likes != null ? Number(b.likes) : (Array.isArray(b.likedBy) ? b.likedBy.length : 0))
            : 0;
          return likesA - likesB;
        } else if (sortOption === 'likes-desc') {
          const likesA = a.isPublic 
            ? (a.likes != null ? Number(a.likes) : (Array.isArray(a.likedBy) ? a.likedBy.length : 0))
            : 0;
          const likesB = b.isPublic 
            ? (b.likes != null ? Number(b.likes) : (Array.isArray(b.likedBy) ? b.likedBy.length : 0))
            : 0;
          return likesB - likesA;
        }
        return 0;
      });

      const totalLikes = isPublic
        ? sorted.reduce(
            (sum, playlist) =>
              sum + Number(playlist.likes != null ? playlist.likes : Array.isArray(playlist.likedBy) ? playlist.likedBy.length : 0),
            0
          )
        : 0;
      const distinctLiked = isPublic
        ? sorted.filter((playlist) => {
            const likeCount =
              playlist.likes != null ? Number(playlist.likes) : Array.isArray(playlist.likedBy) ? playlist.likedBy.length : 0;
            return likeCount > 0;
          }).length
        : 0;

      const sectionKey = isPublic ? 'playlist-public' : 'playlist-private';
      const { items: pagedPlaylists, pageInfo: playlistPageInfo } = getPaginatedList(
        sorted,
        sectionKey,
        PLAYLIST_PAGE_SIZE
      );

      return (
        <>
          <section className="space-y-4">
          <div className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 uppercase tracking-wide">{title}</h3>
              <p className="text-xs text-gray-600">
                {sorted.length.toLocaleString()} playlist{sorted.length === 1 ? '' : 's'}
              </p>
            </div>
            {isPublic && (
              <div className="flex flex-wrap gap-5 text-sm text-gray-700">
                <div className="text-center">
                  <p className="font-semibold text-lg text-gray-900">{formatNumber(totalLikes)}</p>
                  <p className="uppercase tracking-wide text-xs text-gray-500 whitespace-nowrap">Total Likes</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg text-gray-900">
                    {formatNumber(distinctLiked)}
                  </p>
                  <p className="uppercase tracking-wide text-xs text-gray-500 whitespace-nowrap">
                    Distinct Playlists Liked
                  </p>
                </div>
              </div>
            )}
          </div>
          {pagedPlaylists.map((playlist, idx) => {
            const playlistKey = `playlist-${playlist.playlistId ?? idx}`;
            const songsExpanded = expandedPlaylistSections[playlistKey]?.songs ?? false;
            const likesExpanded = expandedPlaylistSections[playlistKey]?.liked ?? false;
            const togglePlaylistSection = (section: 'songs' | 'liked') => {
              setExpandedPlaylistSections((prev) => ({
                ...prev,
                [playlistKey]: {
                  songs: section === 'songs' ? !songsExpanded : songsExpanded,
                  liked: section === 'liked' ? !likesExpanded : likesExpanded
                }
              }));
            };
            const songs: any[] = Array.isArray(playlist.songs) ? playlist.songs : [];
            const likedBy: any[] = Array.isArray(playlist.likedBy) ? playlist.likedBy : [];

            return (
              <div
                key={`${title}-${playlist.playlistId ?? idx}`}
                className="report-section bg-white border border-gray-200 rounded-lg shadow-sm space-y-4"
              >
                <div className="bg-gray-50 px-5 py-3.5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{playlist.playlistName}</h4>
                    <p className="text-sm text-gray-600">
                      Created by <span className="font-medium">{playlist.ownerUsername || 'Unknown'}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Created on {formatDate(playlist.createdAt)}
                    </p>
                  </div>
                    <div className="flex flex-wrap gap-5 text-sm text-gray-700">
                    <div className="text-center">
                      <p className="font-semibold text-lg text-gray-900">
                        {formatNumber(playlist.songCount || 0)}
                      </p>
                      <p className="uppercase tracking-wide text-xs text-gray-500">Songs</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-lg text-gray-900">
                        {formatTime(Number(playlist.totalDuration || 0))}
                      </p>
                      <p className="uppercase tracking-wide text-xs text-gray-500">Total Duration</p>
                    </div>
                    {isPublic && (
                      <div className="text-center">
                        <p className="font-semibold text-lg text-gray-900">
                          {formatNumber(playlist.likes || 0)}
                        </p>
                        <p className="uppercase tracking-wide text-xs text-gray-500">Likes</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Songs in Playlist
                      </h5>
                      {songs.length > 0 && (
                        <button
                          type="button"
                          onClick={() => togglePlaylistSection('songs')}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          aria-expanded={songsExpanded}
                        >
                          {songsExpanded ? 'Hide songs' : 'Show songs'}
                        </button>
                      )}
                    </div>
                    {songs.length === 0 ? (
                      <div className="border border-dashed border-gray-300 rounded-md px-3 py-4 text-center text-sm text-gray-500">
                        No songs were added to this playlist during the selected period.
                      </div>
                    ) : songsExpanded ? (
                      <>
                        {/* Sort Dropdown for Songs */}
                        <div className="mb-3">
                          <label htmlFor={`playlist-songs-sort-${playlistKey}`} className="block text-xs font-medium text-gray-600 mb-1">
                            Sort by:
                          </label>
                          <select
                            id={`playlist-songs-sort-${playlistKey}`}
                            value={playlistSongsSortOptions[playlistKey] || 'songName-asc'}
                            onChange={(e) => {
                              setPlaylistSongsSortOptions((prev) => ({ ...prev, [playlistKey]: e.target.value }));
                            }}
                            className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          >
                            <option value="songName-asc">Song Name (A-Z)</option>
                            <option value="songName-desc">Song Name (Z-A)</option>
                            <option value="artistName-asc">Artist Name (A-Z)</option>
                            <option value="artistName-desc">Artist Name (Z-A)</option>
                            <option value="albumName-asc">Album Name (A-Z)</option>
                            <option value="albumName-desc">Album Name (Z-A)</option>
                            <option value="addedAt-asc">Date Added (Oldest First)</option>
                            <option value="addedAt-desc">Date Added (Newest First)</option>
                          </select>
                        </div>
                        
                        {(() => {
                          const sortOption = playlistSongsSortOptions[playlistKey] || 'songName-asc';
                          const sortedSongs = [...songs].sort((a: any, b: any) => {
                            if (sortOption === 'songName-asc') {
                              return (a.songName || '').toLowerCase().localeCompare((b.songName || '').toLowerCase());
                            } else if (sortOption === 'songName-desc') {
                              return (b.songName || '').toLowerCase().localeCompare((a.songName || '').toLowerCase());
                            } else if (sortOption === 'artistName-asc') {
                              return (a.artistName || '').toLowerCase().localeCompare((b.artistName || '').toLowerCase());
                            } else if (sortOption === 'artistName-desc') {
                              return (b.artistName || '').toLowerCase().localeCompare((a.artistName || '').toLowerCase());
                            } else if (sortOption === 'albumName-asc') {
                              return (a.albumName || '').toLowerCase().localeCompare((b.albumName || '').toLowerCase());
                            } else if (sortOption === 'albumName-desc') {
                              return (b.albumName || '').toLowerCase().localeCompare((a.albumName || '').toLowerCase());
                            } else if (sortOption === 'addedAt-asc') {
                              const dateA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
                              const dateB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
                              return dateA - dateB;
                            } else if (sortOption === 'addedAt-desc') {
                              const dateA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
                              const dateB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
                              return dateB - dateA;
                            }
                            return 0;
                          });
                          
                          return (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                                <thead className="bg-white">
                                  <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <th className="px-3.5 py-2.5 text-left">Song Name</th>
                                    <th className="px-3.5 py-2.5 text-left">Artist</th>
                                    <th className="px-3.5 py-2.5 text-left">Album</th>
                                    <th className="px-3.5 py-2.5 text-left">Added On</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                  {sortedSongs.map((song, songIdx) => (
                              <tr
                                key={`${playlist.playlistId ?? idx}-song-${song.songId ?? songIdx}`}
                                className={songIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                              >
                                <td className="px-3.5 py-2.5 text-sm text-gray-900">{song.songName || 'Unknown Song'}</td>
                                <td className="px-3.5 py-2.5 text-sm text-gray-900">{song.artistName || 'Unknown Artist'}</td>
                                <td className="px-3.5 py-2.5 text-sm text-gray-700">
                                  {song.albumName || 'N/A'}
              </td>
                                <td className="px-3.5 py-2.5 text-sm text-gray-900">
                                  {formatDateTime(song.addedAt)}
              </td>
            </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Click “Show songs” to reveal this list.
                      </div>
                    )}
                  </div>

                  {isPublic && (
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Users Who Liked This Playlist
                        </h5>
                        {likedBy.length > 0 && (
                          <button
                            type="button"
                            onClick={() => togglePlaylistSection('liked')}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                            aria-expanded={likesExpanded}
                          >
                            {likesExpanded ? 'Hide likes' : 'Show likes'}
                          </button>
                        )}
                      </div>
                      {likedBy.length === 0 ? (
                        <div className="border border-dashed border-gray-300 rounded-md px-3 py-4 text-center text-sm text-gray-500">
                          No likes were recorded for this playlist during the selected period.
                        </div>
                      ) : likesExpanded ? (
                        <>
                          {/* Sort Dropdown for Liked Users */}
                          <div className="mb-3">
                            <label htmlFor={`playlist-liked-users-sort-${playlistKey}`} className="block text-xs font-medium text-gray-600 mb-1">
                              Sort by:
                            </label>
                            <select
                              id={`playlist-liked-users-sort-${playlistKey}`}
                              value={playlistLikedUsersSortOptions[playlistKey] || 'username-asc'}
                              onChange={(e) => {
                                setPlaylistLikedUsersSortOptions((prev) => ({ ...prev, [playlistKey]: e.target.value }));
                              }}
                              className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            >
                              <option value="username-asc">Username (A-Z)</option>
                              <option value="username-desc">Username (Z-A)</option>
                              <option value="likedAt-asc">Date Liked (Oldest First)</option>
                              <option value="likedAt-desc">Date Liked (Newest First)</option>
                            </select>
                          </div>
                          
                          {(() => {
                            const sortOption = playlistLikedUsersSortOptions[playlistKey] || 'username-asc';
                            const sortedLikedBy = [...likedBy].sort((a: any, b: any) => {
                              if (sortOption === 'username-asc') {
                                return (a.username || '').toLowerCase().localeCompare((b.username || '').toLowerCase());
                              } else if (sortOption === 'username-desc') {
                                return (b.username || '').toLowerCase().localeCompare((a.username || '').toLowerCase());
                              } else if (sortOption === 'likedAt-asc') {
                                const dateA = a.likedAt ? new Date(a.likedAt).getTime() : 0;
                                const dateB = b.likedAt ? new Date(b.likedAt).getTime() : 0;
                                return dateA - dateB;
                              } else if (sortOption === 'likedAt-desc') {
                                const dateA = a.likedAt ? new Date(a.likedAt).getTime() : 0;
                                const dateB = b.likedAt ? new Date(b.likedAt).getTime() : 0;
                                return dateB - dateA;
                              }
                              return 0;
                            });
                            
                            return (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                                  <thead className="bg-white">
                                    <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                      <th className="px-3.5 py-2.5 text-left">Username</th>
                                      <th className="px-3.5 py-2.5 text-left">Liked On</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-100">
                                    {sortedLikedBy.map((user, likeIdx) => (
                                <tr
                                  key={`${playlist.playlistId ?? idx}-liked-${user.userId ?? likeIdx}`}
                                  className={likeIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                                >
                                  <td className="px-3.5 py-2.5 text-sm text-gray-900">{user.username || 'Unknown'}</td>
                                  <td className="px-3.5 py-2.5 text-sm text-gray-900">{formatDateTime(user.likedAt)}</td>
            </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Click “Show likes” to reveal this list.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </section>
          <PaginationControls
            pageInfo={playlistPageInfo}
            onPageChange={(page) => setPageForKey(sectionKey, page, playlistPageInfo.pageCount)}
            className="mt-2"
          />
        </>
      );
    };

    return (
      <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Playlist Activity</h3>
              <p className="text-xs text-gray-600">Breakdown of public and private playlists during the reporting period</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPlaylistActivityFilters(!showPlaylistActivityFilters)}
              className="px-3 py-1 text-xs font-semibold rounded-full border border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              {showPlaylistActivityFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>
        
        {/* Playlist Activity Sort */}
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
          <div className="flex items-center gap-3">
            <label htmlFor="playlist-activity-sort" className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Sort by:
            </label>
            <select
              id="playlist-activity-sort"
              value={playlistActivitySort}
              onChange={(e) => {
                setPlaylistActivitySort(e.target.value);
                setPaginationPages((prev) => ({ ...prev, 'playlist-public': 0, 'playlist-private': 0 }));
              }}
              className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="playlistName-asc">Playlist Name (A-Z)</option>
              <option value="playlistName-desc">Playlist Name (Z-A)</option>
              <option value="username-asc">Username (A-Z)</option>
              <option value="username-desc">Username (Z-A)</option>
              <option value="dateCreated-asc">Date Created (Oldest First)</option>
              <option value="dateCreated-desc">Date Created (Newest First)</option>
              <option value="songs-asc">Songs (Low to High)</option>
              <option value="songs-desc">Songs (High to Low)</option>
              <option value="totalDuration-asc">Total Duration (Shortest to Longest)</option>
              <option value="totalDuration-desc">Total Duration (Longest to Shortest)</option>
              <option value="likes-asc">Likes (Low to High)</option>
              <option value="likes-desc">Likes (High to Low)</option>
            </select>
          </div>
        </div>
        
        {/* Playlist Activity Filters */}
        {showPlaylistActivityFilters && (
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-4">
          <h5 className="text-xs font-semibold text-gray-700 mb-3">Filters</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Playlist Type */}
            <div>
              <label htmlFor="filter-playlist-type" className="block text-xs font-medium text-gray-600 mb-1">
                Playlist Type:
              </label>
              <select
                id="filter-playlist-type"
                value={playlistActivityFilters.playlistType}
                onChange={(e) => {
                  setPlaylistActivityFilters((prev) => ({ ...prev, playlistType: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'playlist-public': 0, 'playlist-private': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="All">All</option>
                <option value="Public">Public</option>
                <option value="Private">Private</option>
              </select>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="filter-playlist-username" className="block text-xs font-medium text-gray-600 mb-1">
                Username:
              </label>
              <input
                type="text"
                id="filter-playlist-username"
                value={playlistActivityFilters.username}
                onChange={(e) => {
                  setPlaylistActivityFilters((prev) => ({ ...prev, username: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'playlist-public': 0, 'playlist-private': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter username"
              />
            </div>

            {/* Likes Under */}
            <div>
              <label htmlFor="filter-playlist-likes-under" className="block text-xs font-medium text-gray-600 mb-1">
                Likes Under:
              </label>
              <input
                type="number"
                id="filter-playlist-likes-under"
                min="0"
                value={playlistActivityFilters.likesUnder}
                onChange={(e) => {
                  setPlaylistActivityFilters((prev) => ({ ...prev, likesUnder: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'playlist-public': 0, 'playlist-private': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Likes Over */}
            <div>
              <label htmlFor="filter-playlist-likes-over" className="block text-xs font-medium text-gray-600 mb-1">
                Likes Over:
              </label>
              <input
                type="number"
                id="filter-playlist-likes-over"
                min="0"
                value={playlistActivityFilters.likesOver}
                onChange={(e) => {
                  setPlaylistActivityFilters((prev) => ({ ...prev, likesOver: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'playlist-public': 0, 'playlist-private': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Songs Under */}
            <div>
              <label htmlFor="filter-playlist-songs-under" className="block text-xs font-medium text-gray-600 mb-1">
                Songs Under:
              </label>
              <input
                type="number"
                id="filter-playlist-songs-under"
                min="0"
                value={playlistActivityFilters.songsUnder}
                onChange={(e) => {
                  setPlaylistActivityFilters((prev) => ({ ...prev, songsUnder: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'playlist-public': 0, 'playlist-private': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Songs Over */}
            <div>
              <label htmlFor="filter-playlist-songs-over" className="block text-xs font-medium text-gray-600 mb-1">
                Songs Over:
              </label>
              <input
                type="number"
                id="filter-playlist-songs-over"
                min="0"
                value={playlistActivityFilters.songsOver}
                onChange={(e) => {
                  setPlaylistActivityFilters((prev) => ({ ...prev, songsOver: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'playlist-public': 0, 'playlist-private': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Duration Under */}
            <div>
              <label htmlFor="filter-playlist-duration-under" className="block text-xs font-medium text-gray-600 mb-1">
                Duration Under:
              </label>
              <input
                type="text"
                id="filter-playlist-duration-under"
                value={(() => {
                  const raw = playlistActivityFilters.durationUnder;
                  if (!raw) return '';
                  if (raw.length <= 2) return raw;
                  if (raw.length <= 4) {
                    const hh = raw.substring(0, 2);
                    const mm = raw.substring(2);
                    return `${hh}:${mm}`;
                  }
                  const hh = raw.substring(0, 2);
                  const mm = raw.substring(2, 4);
                  const ss = raw.substring(4);
                  return `${hh}:${mm}:${ss}`;
                })()}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPlaylistActivityFilters((prev) => ({ ...prev, durationUnder: raw }));
                  setPaginationPages((prev) => ({ ...prev, 'playlist-public': 0, 'playlist-private': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="HH:MM:SS"
                maxLength={8}
              />
            </div>

            {/* Duration Over */}
            <div>
              <label htmlFor="filter-playlist-duration-over" className="block text-xs font-medium text-gray-600 mb-1">
                Duration Over:
              </label>
              <input
                type="text"
                id="filter-playlist-duration-over"
                value={(() => {
                  const raw = playlistActivityFilters.durationOver;
                  if (!raw) return '';
                  if (raw.length <= 2) return raw;
                  if (raw.length <= 4) {
                    const hh = raw.substring(0, 2);
                    const mm = raw.substring(2);
                    return `${hh}:${mm}`;
                  }
                  const hh = raw.substring(0, 2);
                  const mm = raw.substring(2, 4);
                  const ss = raw.substring(4);
                  return `${hh}:${mm}:${ss}`;
                })()}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPlaylistActivityFilters((prev) => ({ ...prev, durationOver: raw }));
                  setPaginationPages((prev) => ({ ...prev, 'playlist-public': 0, 'playlist-private': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="HH:MM:SS"
                maxLength={8}
              />
            </div>
          </div>
        </div>
        )}
        
        <div className="px-5 py-4 space-y-6">
          {(playlistActivityFilters.playlistType === 'All' || playlistActivityFilters.playlistType === 'Public') && 
            renderPlaylistSection(publicPlaylists, 'Public Playlists', true)}
          {(playlistActivityFilters.playlistType === 'All' || playlistActivityFilters.playlistType === 'Private') && 
            renderPlaylistSection(privatePlaylists, 'Private Playlists', false)}
        </div>
      </div>
    );
  };

  const formatDate = (value?: string | null): string => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString();
  };
  const formatNumber = (value?: number | null): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) return '0';
    return value.toLocaleString();
  };

  const formatPercentage = (value?: number | null): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return '0.00%';
    }
    return `${value.toFixed(2)}%`;
  };

  const formatDateTime = (value?: string | null): string => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  };

  const availableSongActivity = useMemo(() => {
    if (isIndividualUser) {
      const userType = reportData?.userDetails?.userType;
      if (userType === 'Artist') {
        return (
          showSongStats &&
          Array.isArray(reportData?.artistSongActivity) &&
          reportData.artistSongActivity.length > 0
        );
      }
      return (
        showSongStats &&
        Array.isArray(reportData?.listenerSongActivity) &&
        reportData.listenerSongActivity.length > 0
      );
    }
    return (
      showSongStats &&
      Array.isArray(reportData?.songActivity) &&
      reportData.songActivity.length > 0
    );
  }, [
    isIndividualUser,
    reportData?.artistSongActivity,
    reportData?.listenerSongActivity,
    reportData?.songActivity,
    reportData?.userDetails?.userType,
    showSongStats
  ]);

  const availableArtistActivity = useMemo(() => {
    if (isIndividualUser) {
      const userType = reportData?.userDetails?.userType;
      if (userType !== 'Listener') {
        return false;
      }
      return (
        showArtistStats &&
        Array.isArray(reportData?.listenerArtistActivity) &&
        reportData.listenerArtistActivity.length > 0
      );
    }
    return (
      showArtistStats &&
      includeArtists &&
      Array.isArray(reportData?.artistActivity) &&
      reportData.artistActivity.length > 0
    );
  }, [
    includeArtists,
    isIndividualUser,
    reportData?.artistActivity,
    reportData?.listenerArtistActivity,
    reportData?.userDetails?.userType,
    showArtistStats
  ]);

  const availableAlbumActivity = useMemo(() => {
    if (isIndividualUser) {
      const userType = reportData?.userDetails?.userType;
      if (userType === 'Listener') {
        return (
          Array.isArray(reportData?.listenerAlbumActivity) &&
          reportData.listenerAlbumActivity.length > 0
        );
      }
      if (userType === 'Artist') {
        return (
          Array.isArray(reportData?.artistAlbumActivity) &&
          reportData.artistAlbumActivity.length > 0
        );
      }
      return false;
    }
    return (
      includeAlbumStatistics &&
      showArtistStats &&
      Array.isArray(reportData?.albumActivity) &&
      reportData.albumActivity.length > 0
    );
  }, [
    includeAlbumStatistics,
    isIndividualUser,
    reportData?.albumActivity,
    reportData?.artistAlbumActivity,
    reportData?.listenerAlbumActivity,
    reportData?.userDetails?.userType,
    showArtistStats
  ]);

  const availablePlaylistActivity = useMemo(() => {
    if (isIndividualUser) {
      const userType = reportData?.userDetails?.userType;
      if (userType !== 'Listener') {
        return false;
      }
      return (
        Array.isArray(reportData?.listenerPlaylistActivity) &&
        reportData.listenerPlaylistActivity.length > 0
      );
    }
    return (
      includePlaylistStatistics &&
      reportData?.playlistActivity &&
      (Array.isArray(reportData.playlistActivity.publicPlaylists) ||
        Array.isArray(reportData.playlistActivity.privatePlaylists)) &&
      ((reportData.playlistActivity.publicPlaylists?.length ?? 0) > 0 ||
        (reportData.playlistActivity.privatePlaylists?.length ?? 0) > 0)
    );
  }, [
    includePlaylistStatistics,
    isIndividualUser,
    reportData?.listenerPlaylistActivity,
    reportData?.playlistActivity,
    reportData?.userDetails?.userType
  ]);

  // Render individual user report
  const renderIndividualUserReport = () => {
    const details = reportData.userDetails || {};

    const resolvedProfileImage =
      details?.profilePicture && typeof details.profilePicture === 'string'
        ? details.profilePicture.startsWith('data:')
          ? details.profilePicture
          : getFileUrl(details.profilePicture)
        : getFileUrl('profile-pictures/default.jpg');

    const infoItems = [
      { label: 'Username', value: details.username || 'N/A' },
      { label: 'First Name', value: details.firstName || 'N/A' },
      { label: 'Last Name', value: details.lastName || 'N/A' },
      { label: 'Email', value: details.email || 'N/A' },
      { label: 'Date of Birth', value: formatDate(details.dateOfBirth) },
      {
        label: 'Age',
        value: typeof details.age === 'number' ? `${details.age}` : 'N/A'
      },
      { label: 'User Type', value: details.userType || 'N/A' },
      { label: 'Date Joined', value: formatDate(details.dateJoined) },
      { label: 'Country', value: details.country || 'N/A' },
      { label: 'City', value: details.city || 'N/A' }
    ];

    // Add suspension/ban date if user is suspended or banned
    if ((details.accountStatus === 'Suspended' || details.accountStatus === 'Banned') && details.statusDate) {
      infoItems.push({
        label: `${details.accountStatus} Date`,
        value: formatDate(details.statusDate)
      });
    }

    infoItems.push({ label: 'Account Status', value: details.accountStatus || 'Active' });

    if (details.userType === 'Artist') {
      const verificationValue = details.verified
        ? `Verified${details.verificationDate ? ` on ${formatDate(details.verificationDate)}` : ''}`
        : 'Not Verified';
      infoItems.splice(7, 0, {
        label: 'Verification Status',
        value: verificationValue
      });
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-red-200 shadow bg-gray-100 flex items-center justify-center">
              {resolvedProfileImage ? (
                <img
                  src={resolvedProfileImage}
                  alt={`${details.username || 'User'} profile`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-semibold text-gray-500">
                  {(details.username || 'U').slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {infoItems.map((item) => (
              <div key={item.label} className="flex flex-col">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {item.label}
                </span>
                <span className="text-sm text-gray-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
        </div>
      </div>
    );
  };


  useEffect(() => {
    if (viewMode === 'songActivity' && !availableSongActivity) {
      setViewMode('summary');
    } else if (viewMode === 'artistActivity' && !availableArtistActivity) {
      setViewMode('summary');
    } else if (
      viewMode === 'albumActivity' &&
      ((!isIndividualUser && (!includeAlbumStatistics || !availableAlbumActivity)) ||
        (isIndividualUser && !availableAlbumActivity))
    ) {
      setViewMode('summary');
    } else if (
      viewMode === 'playlistActivity' &&
      ((!isIndividualUser && (!includePlaylistStatistics || !availablePlaylistActivity)) ||
        (isIndividualUser && !availablePlaylistActivity))
    ) {
      setViewMode('summary');
    }
  }, [
    availableAlbumActivity,
    availableArtistActivity,
    availablePlaylistActivity,
    availableSongActivity,
    includeAlbumStatistics,
    includePlaylistStatistics,
    isIndividualUser,
    viewMode
  ]);

  useEffect(() => {
    setExpandedSummaryCharts({
      country: Boolean(countryChartData),
      age: Boolean(ageHistogramData)
    });
  }, [countryChartData, ageHistogramData]);


  const reportMeta = reportData?.meta ?? {};
  const reportStartDate: string | undefined = reportMeta.startDate;
  const reportEndDate: string | undefined = reportMeta.endDate;

  const formatRangeDate = useMemo(() => {
    return (value?: string) => {
      if (!value) return undefined;
      // Parse date string as local date to avoid timezone issues
      // If it's in YYYY-MM-DD format, parse it directly
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (Number.isNaN(date.getTime())) {
          return value;
        }
        return date.toLocaleDateString();
      }
      // For other formats, try standard parsing
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      return date.toLocaleDateString();
    };
  }, []);

  const startDateLabel = useMemo(() => formatRangeDate(reportStartDate), [formatRangeDate, reportStartDate]);
  const endDateLabel = useMemo(() => formatRangeDate(reportEndDate), [formatRangeDate, reportEndDate]);

  const reportingRange = useMemo(() => {
    const startLabel = startDateLabel;
    const endLabel = endDateLabel;

    if (startLabel && endLabel) {
      return `${startLabel} – ${endLabel}`;
    }
    if (startLabel) {
      return `Starting ${startLabel}`;
    }
    if (endLabel) {
      return `Through ${endLabel}`;
    }
    return undefined;
  }, [reportStartDate, reportEndDate]);

  const generatedAt = useMemo(() => {
    const stamp = reportMeta.generatedAt;
    const date = stamp ? new Date(stamp) : new Date();
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }
    return date.toLocaleString();
  }, [reportMeta.generatedAt]);

  type SummaryRow = {
    label: string;
    value?: React.ReactNode;
    helper?: React.ReactNode;
  };

  interface SummarySectionData {
    title: string;
    rows: SummaryRow[];
  }

const SummarySection: React.FC<{ title: string; rows: SummaryRow[] }> = ({ title, rows }) => (
    <section
    className="report-section print-keep-together bg-white border border-gray-200 rounded-lg shadow-sm"
    >
      <div className="bg-gray-100 px-4 py-2.5 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800 uppercase tracking-wider">{title}</h3>
      </div>
      <table className="min-w-full text-xs md:text-sm">
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${title}-${idx}`} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
              <td className="w-2/3 px-4 py-2.5 border-b border-gray-200">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800">{row.label}</span>
                  {row.helper && <span className="mt-0.5 text-[11px] text-gray-500">{row.helper}</span>}
                </div>
              </td>
              <td className="w-1/3 px-4 py-2.5 text-right border-b border-gray-200 text-gray-900 font-semibold">
                {row.value ?? 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );

  const summarySections = useMemo<SummarySectionData[]>(() => {
    if (isIndividualUser) return [];

    const sections: SummarySectionData[] = [];
    const totalListeners = includeListeners ? Number(reportData.userCounts?.listeners ?? 0) : 0;
    const totalArtists = includeArtists ? Number(reportData.userCounts?.artists ?? 0) : 0;
    const totalUsers = totalListeners + totalArtists;

    const onlyListeners = includeListeners && !includeArtists;
    const onlyArtists = includeArtists && !includeListeners;

    const listenerPercentage = totalUsers > 0 ? (totalListeners / totalUsers) * 100 : null;
    const artistPercentage = totalUsers > 0 ? (totalArtists / totalUsers) * 100 : null;


    const totalUsersHelper = (() => {
      if (onlyListeners || onlyArtists) {
        return undefined;
      }
      if (!totalUsers) {
        if (includeListeners && includeArtists) return undefined;
        return undefined;
      }
      const segments: string[] = [];
      if (includeListeners && includeArtists) {
        if (listenerPercentage != null) segments.push(`Listeners - ${formatPercentage(listenerPercentage)}`);
        if (artistPercentage != null) segments.push(`Artists - ${formatPercentage(artistPercentage)}`);
      }
      return segments.length ? segments.join(', ') : undefined;
    })();

    const overviewRows: SummaryRow[] = [
      {
        label: 'Total Users Created',
        value: formatNumber(totalUsers),
        helper: totalUsersHelper
      }
    ];

    if (includeListeners && !onlyListeners) {
      overviewRows.push({
        label: 'Listener Accounts Created',
        value: formatNumber(totalListeners)
      });
    }

    if (includeArtists) {
      overviewRows.push({
        label: 'Artist Accounts Created',
        value: formatNumber(totalArtists)
      });
    }

    // Login metrics removed from the summary view per request.

    sections.push({
      title: 'User Creation',
      rows: overviewRows
    });

    if (showSongStats) {
      const songRows: SummaryRow[] = [];
      if (includeListeners) {
        songRows.push({
          label: 'Songs Played by Listeners',
          value: formatNumber(reportData.songsListened ?? 0)
        });
      }
      if (includeArtists) {
        songRows.push({
          label: 'Songs Uploaded by Artists',
          value: formatNumber(reportData.songsUploaded ?? 0)
        });
      }
      songRows.push({
        label: 'Song Likes',
        value: formatNumber(reportData.songsLiked ?? 0)
      });

      const totalListeningTime =
        Array.isArray(reportData.songActivity)
          ? reportData.songActivity.reduce(
              (sum: number, song: any) => sum + Number(song.totalListeningTime ?? 0),
              0
            )
          : 0;

      const totalListenEvents =
        Array.isArray(reportData.songActivity)
          ? reportData.songActivity.reduce(
              (sum: number, song: any) =>
                sum +
                (Array.isArray(song.listenerDetails)
                  ? song.listenerDetails.reduce(
                      (listenerSum: number, listener: any) =>
                        listenerSum + Number(listener.listenCount ?? 0),
                      0
                    )
                  : 0),
              0
            )
          : 0;

      const overallAverageListeningTime =
        totalListenEvents > 0 ? Math.round(totalListeningTime / totalListenEvents) : 0;

      songRows.push({
        label: 'Total Listening Duration',
        value: formatTime(totalListeningTime)
      });

      songRows.push({
        label: 'Average Listen Duration Per User',
        value: formatTime(overallAverageListeningTime)
      });

      sections.push({
        title: 'Song Activity',
        rows: songRows
      });
    }

    if (showArtistStats && includeArtists) {
      sections.push({
        title: 'Artist Engagement',
        rows: [
          {
            label: 'Artist Follows',
            value: formatNumber(reportData.artistsFollowed ?? 0)
          },
        ]
      });
    }

    if (includePlaylistStatistics && reportData.playlistStats) {
      const publicCount = Number(reportData.playlistStats.publicPlaylists ?? 0);
      const privateCount = Number(reportData.playlistStats.privatePlaylists ?? 0);
      const totalPlaylists = publicCount + privateCount;

      sections.push({
        title: 'Playlist Performance',
        rows: [
          {
            label: 'Playlists Created',
            value: formatNumber(reportData.playlistStats.totalCreated ?? 0),
            helper: (() => {
              if (totalPlaylists === 0) return undefined;
              const publicPct = ((publicCount / totalPlaylists) * 100).toFixed(0);
              const privatePct = ((privateCount / totalPlaylists) * 100).toFixed(0);
              return `Public - ${publicPct}%, Private - ${privatePct}%`;
            })()
          },
          ...(publicCount > 0
            ? [{ label: 'Public Playlists', value: formatNumber(publicCount) }]
            : []),
          ...(privateCount > 0
            ? [{ label: 'Private Playlists', value: formatNumber(privateCount) }]
            : []),
          { label: 'Playlist Likes', value: formatNumber(reportData.playlistStats.totalLiked ?? 0) },
        ]
      });
    }

    if (includeAlbumStatistics && showArtistStats && reportData.albumStats && includeArtists) {
      sections.push({
        title: 'Album Activity',
        rows: [
          { label: 'Albums Created', value: formatNumber(reportData.albumStats.totalCreated ?? 0) },
          { label: 'Album Likes', value: formatNumber(reportData.albumStats.totalLiked ?? 0) },
        ]
      });
    }

    // Age demographics and country distribution are now visualized via charts below.

    return sections;
  }, [
    includeAlbumStatistics,
    includeArtists,
    includeGeographics,
    includeListeners,
    includePlaylistStatistics,
    isIndividualUser,
    reportData.albumStats,
    reportData.artistsFollowed,
    reportData.distinctArtistsFollowed,
    reportData.distinctSongsLiked,
    reportData.loginCounts,
    reportData.loginTime,
    reportData.playlistStats,
    reportData.songsLiked,
    reportData.songsListened,
    reportData.songsUploaded,
    reportData.userCounts,
    reportData.ageDemographics,
    reportData.countryStats,
    showArtistStats,
    showAgeDemographics,
    showSongStats
  ]);

  const renderSongActivity = () => {
    if (isIndividualUser) {
      const userType = reportData.userDetails?.userType;
      if (userType === 'Artist') {
        return renderIndividualArtistSongActivity();
      }
      return renderIndividualListenerSongActivity();
    }

    return renderAggregateSongActivity();
  };

  const renderIndividualListenerSongActivity = () => {
    if (!showSongStats) {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          Song activity reporting is disabled for this export.
        </div>
      );
    }

    const userType = reportData.userDetails?.userType;
    if (userType !== 'Listener') {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          Song activity is only available for listener accounts.
        </div>
      );
    }

    const summary = reportData.listenerSongSummary || {};
    const allSongs = Array.isArray(reportData.listenerSongActivity)
      ? [...reportData.listenerSongActivity]
      : [];
    
    // Extract unique genres and artists for filter options
    const uniqueGenres = Array.from(new Set(allSongs.map((song: any) => song.genre).filter(Boolean))).sort();
    const uniqueArtists = Array.from(new Set(allSongs.map((song: any) => song.artistUsername).filter(Boolean))).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    
    // Helper function to parse time to seconds (HH:MM:SS format)
    const parseTimeToSeconds = (timeStr: string): number => {
      if (!timeStr || !timeStr.trim()) return 0;
      const digitsOnly = timeStr.trim().replace(/\D/g, '');
      if (digitsOnly.length === 0) return 0;
      const padded = digitsOnly.padStart(6, '0');
      const hours = parseInt(padded.substring(0, 2), 10) || 0;
      const minutes = parseInt(padded.substring(2, 4), 10) || 0;
      const seconds = parseInt(padded.substring(4, 6), 10) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    };
    
    // Apply filters
    const filteredSongs = allSongs.filter((song: any) => {
      // Genre filter (checkable list)
      if (songFilters.selectedGenres.length > 0) {
        const songGenre = song.genre ? String(song.genre).toLowerCase().trim() : '';
        const selectedGenresLower = songFilters.selectedGenres.map(g => g.toLowerCase().trim());
        if (!selectedGenresLower.includes(songGenre)) {
          return false;
        }
      }
      
      // Song length filter (HH:MM:SS format)
      if (songFilters.songLengthUnder) {
        const thresholdSeconds = parseTimeToSeconds(songFilters.songLengthUnder);
        const songLengthSeconds = Number(song.duration || 0);
        if (thresholdSeconds > 0 && songLengthSeconds >= thresholdSeconds) {
          return false;
        }
      }
      
      if (songFilters.songLengthOver) {
        const thresholdSeconds = parseTimeToSeconds(songFilters.songLengthOver);
        const songLengthSeconds = Number(song.duration || 0);
        if (thresholdSeconds > 0 && songLengthSeconds <= thresholdSeconds) {
          return false;
        }
      }
      
      // Artist filter (checkable list)
      if (songFilters.selectedArtists.length > 0) {
        const songArtist = song.artistUsername ? String(song.artistUsername).toLowerCase().trim() : '';
        const selectedArtistsLower = songFilters.selectedArtists.map(a => a.toLowerCase().trim());
        if (!selectedArtistsLower.includes(songArtist)) {
          return false;
        }
      }
      
      // Total Listens Under filter
      if (songFilters.totalListensUnder) {
        const threshold = Number(songFilters.totalListensUnder);
        const totalListens = Number(song.totalListens ?? song.listenDetails?.length ?? 0);
        if (!Number.isNaN(threshold) && totalListens >= threshold) {
          return false;
        }
      }
      
      // Total Listens Over filter
      if (songFilters.totalListensOver) {
        const threshold = Number(songFilters.totalListensOver);
        const totalListens = Number(song.totalListens ?? song.listenDetails?.length ?? 0);
        if (!Number.isNaN(threshold) && totalListens <= threshold) {
          return false;
        }
      }
      
      // Average Listen Duration Under filter
      if (songFilters.averageListenDurationUnder) {
        const threshold = Number(songFilters.averageListenDurationUnder);
        const avgDuration = Number(song.averageListeningDuration ?? 0);
        if (!Number.isNaN(threshold) && avgDuration >= threshold) {
          return false;
        }
      }
      
      // Average Listen Duration Over filter
      if (songFilters.averageListenDurationOver) {
        const threshold = Number(songFilters.averageListenDurationOver);
        const avgDuration = Number(song.averageListeningDuration ?? 0);
        if (!Number.isNaN(threshold) && avgDuration <= threshold) {
          return false;
        }
      }
      
      // Total Listen Duration Under filter
      if (songFilters.totalListenDurationUnder) {
        const thresholdSeconds = parseTimeToSeconds(songFilters.totalListenDurationUnder);
        const totalDurationSeconds = Number(song.totalListeningDuration ?? 0);
        if (thresholdSeconds > 0 && totalDurationSeconds >= thresholdSeconds) {
          return false;
        }
      }
      
      // Total Listen Duration Over filter
      if (songFilters.totalListenDurationOver) {
        const thresholdSeconds = parseTimeToSeconds(songFilters.totalListenDurationOver);
        const totalDurationSeconds = Number(song.totalListeningDuration ?? 0);
        if (thresholdSeconds > 0 && totalDurationSeconds <= thresholdSeconds) {
          return false;
        }
      }
      
      // Liked filter
      if (songFilters.liked !== 'All') {
        if (songFilters.liked === 'Liked' && !song.liked) return false;
        if (songFilters.liked === 'Not Liked' && song.liked) return false;
      }
      
      // Verified filter
      if (songFilters.verified !== 'All') {
        const isVerified = song.artistVerified ?? false;
        if (songFilters.verified === 'Verified' && !isVerified) return false;
        if (songFilters.verified === 'Not Verified' && isVerified) return false;
      }
      
      return true;
    });
    
    // Sort filtered songs
    const sortedSongs = [...filteredSongs].sort((a: any, b: any) => {
      const sortOption = individualListenerSongActivitySort;
      let comparison = 0;

      if (sortOption === 'artistUsername-asc') {
        const artistA = (a?.artistUsername || '').toLowerCase();
        const artistB = (b?.artistUsername || '').toLowerCase();
        comparison = artistA.localeCompare(artistB);
      } else if (sortOption === 'artistUsername-desc') {
        const artistA = (a?.artistUsername || '').toLowerCase();
        const artistB = (b?.artistUsername || '').toLowerCase();
        comparison = artistB.localeCompare(artistA);
      } else if (sortOption === 'songName-asc') {
        comparison = (a?.songName || '').toLowerCase().localeCompare((b?.songName || '').toLowerCase());
      } else if (sortOption === 'songName-desc') {
        comparison = (b?.songName || '').toLowerCase().localeCompare((a?.songName || '').toLowerCase());
      } else if (sortOption === 'songLength-asc') {
        comparison = Number(a?.duration || 0) - Number(b?.duration || 0);
      } else if (sortOption === 'songLength-desc') {
        comparison = Number(b?.duration || 0) - Number(a?.duration || 0);
      } else if (sortOption === 'releaseDate-asc') {
        const dateA = a?.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const dateB = b?.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        comparison = dateA - dateB;
      } else if (sortOption === 'releaseDate-desc') {
        const dateA = a?.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const dateB = b?.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        comparison = dateB - dateA;
      } else if (sortOption === 'totalListens-asc') {
        const listensA = Number(a?.totalListens ?? a?.listenDetails?.length ?? 0);
        const listensB = Number(b?.totalListens ?? b?.listenDetails?.length ?? 0);
        comparison = listensA - listensB;
      } else if (sortOption === 'totalListens-desc') {
        const listensA = Number(a?.totalListens ?? a?.listenDetails?.length ?? 0);
        const listensB = Number(b?.totalListens ?? b?.listenDetails?.length ?? 0);
        comparison = listensB - listensA;
      } else if (sortOption === 'averageListenDuration-asc') {
        comparison = Number(a?.averageListeningDuration || 0) - Number(b?.averageListeningDuration || 0);
      } else if (sortOption === 'averageListenDuration-desc') {
        comparison = Number(b?.averageListeningDuration || 0) - Number(a?.averageListeningDuration || 0);
      } else if (sortOption === 'totalListenDuration-asc') {
        comparison = Number(a?.totalListeningDuration || 0) - Number(b?.totalListeningDuration || 0);
      } else if (sortOption === 'totalListenDuration-desc') {
        comparison = Number(b?.totalListeningDuration || 0) - Number(a?.totalListeningDuration || 0);
      }

      return comparison;
    });
    
    const { items: songs, pageInfo: songPageInfo } = getPaginatedList(
      sortedSongs,
      'individualListenerSongActivity',
      SONG_PAGE_SIZE
    );

    const summaryCards = [
      { label: 'Total Songs Listened', value: formatNumber(summary.totalSongsListened || 0) },
      { label: 'Distinct Songs Played', value: formatNumber(summary.distinctSongsListened || 0) },
      { label: 'Songs Liked', value: formatNumber(summary.songsLiked || 0) },
      { label: 'Total Listen Duration', value: formatTime(summary.totalListeningDuration || 0) },
      { label: 'Average Listen Duration', value: formatTime(summary.averageListeningDuration || 0) }
    ];

    return (
      <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Song Activity</h3>
              <p className="text-xs text-gray-600">Personal listening activity for this account</p>
            </div>
            <button
              type="button"
              onClick={() => setShowIndividualSongFilters(!showIndividualSongFilters)}
              className="px-3 py-1 text-xs font-semibold rounded-full border border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              {showIndividualSongFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-center shadow-sm"
              >
                <p className="text-xs uppercase tracking-wide text-gray-500">{card.label}</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          {showIndividualSongFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Filters</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {/* Total Listens Under */}
                <div>
                  <label htmlFor="filter-song-total-listens-under" className="block text-xs font-medium text-gray-600 mb-1">
                    Total Listens Under:
                  </label>
                  <input
                    type="number"
                    id="filter-song-total-listens-under"
                    min="0"
                    value={songFilters.totalListensUnder}
                    onChange={(e) => {
                      setSongFilters((prev) => ({ ...prev, totalListensUnder: e.target.value }));
                      setPaginationPages((prev) => ({ ...prev, 'individualListenerSongActivity': 0 }));
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter number"
                  />
                </div>

                {/* Total Listens Over */}
                <div>
                  <label htmlFor="filter-song-total-listens-over" className="block text-xs font-medium text-gray-600 mb-1">
                    Total Listens Over:
                  </label>
                  <input
                    type="number"
                    id="filter-song-total-listens-over"
                    min="0"
                    value={songFilters.totalListensOver}
                    onChange={(e) => {
                      setSongFilters((prev) => ({ ...prev, totalListensOver: e.target.value }));
                      setPaginationPages((prev) => ({ ...prev, 'individualListenerSongActivity': 0 }));
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter number"
                  />
                </div>

                {/* Average Listen Duration Under */}
                <div>
                  <label htmlFor="filter-song-avg-listen-duration-under" className="block text-xs font-medium text-gray-600 mb-1">
                    Avg Listen Duration Under:
                  </label>
                  <input
                    type="number"
                    id="filter-song-avg-listen-duration-under"
                    min="0"
                    value={songFilters.averageListenDurationUnder}
                    onChange={(e) => {
                      setSongFilters((prev) => ({ ...prev, averageListenDurationUnder: e.target.value }));
                      setPaginationPages((prev) => ({ ...prev, 'individualListenerSongActivity': 0 }));
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter seconds"
                  />
                </div>

                {/* Average Listen Duration Over */}
                <div>
                  <label htmlFor="filter-song-avg-listen-duration-over" className="block text-xs font-medium text-gray-600 mb-1">
                    Avg Listen Duration Over:
                  </label>
                  <input
                    type="number"
                    id="filter-song-avg-listen-duration-over"
                    min="0"
                    value={songFilters.averageListenDurationOver}
                    onChange={(e) => {
                      setSongFilters((prev) => ({ ...prev, averageListenDurationOver: e.target.value }));
                      setPaginationPages((prev) => ({ ...prev, 'individualListenerSongActivity': 0 }));
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter seconds"
                  />
                </div>

                {/* Total Listen Duration Under */}
                <div>
                  <label htmlFor="filter-song-total-listen-duration-under" className="block text-xs font-medium text-gray-600 mb-1">
                    Total Listen Duration Under:
                  </label>
                  <input
                    type="text"
                    id="filter-song-total-listen-duration-under"
                    value={(() => {
                      const raw = songFilters.totalListenDurationUnder;
                      if (!raw) return '';
                      if (raw.length <= 2) {
                        return raw;
                      } else if (raw.length <= 4) {
                        const hh = raw.substring(0, 2);
                        const mm = raw.substring(2);
                        return `${hh}:${mm}`;
                      } else {
                        const hh = raw.substring(0, 2);
                        const mm = raw.substring(2, 4);
                        const ss = raw.substring(4);
                        return `${hh}:${mm}:${ss}`;
                      }
                    })()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setSongFilters((prev) => ({ ...prev, totalListenDurationUnder: raw }));
                      setPaginationPages((prev) => ({ ...prev, 'individualListenerSongActivity': 0 }));
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="HH:MM:SS"
                    maxLength={8}
                  />
                </div>

                {/* Total Listen Duration Over */}
                <div>
                  <label htmlFor="filter-song-total-listen-duration-over" className="block text-xs font-medium text-gray-600 mb-1">
                    Total Listen Duration Over:
                  </label>
                  <input
                    type="text"
                    id="filter-song-total-listen-duration-over"
                    value={(() => {
                      const raw = songFilters.totalListenDurationOver;
                      if (!raw) return '';
                      if (raw.length <= 2) {
                        return raw;
                      } else if (raw.length <= 4) {
                        const hh = raw.substring(0, 2);
                        const mm = raw.substring(2);
                        return `${hh}:${mm}`;
                      } else {
                        const hh = raw.substring(0, 2);
                        const mm = raw.substring(2, 4);
                        const ss = raw.substring(4);
                        return `${hh}:${mm}:${ss}`;
                      }
                    })()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setSongFilters((prev) => ({ ...prev, totalListenDurationOver: raw }));
                      setPaginationPages((prev) => ({ ...prev, 'individualListenerSongActivity': 0 }));
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="HH:MM:SS"
                    maxLength={8}
                  />
                </div>

                {/* Song Length Under */}
                <div>
                  <label htmlFor="filter-song-length-under" className="block text-xs font-medium text-gray-600 mb-1">
                    Song Length Under:
                  </label>
                  <input
                    type="text"
                    id="filter-song-length-under"
                    value={(() => {
                      const raw = songFilters.songLengthUnder;
                      if (!raw) return '';
                      if (raw.length <= 2) {
                        return raw;
                      } else if (raw.length <= 4) {
                        const hh = raw.substring(0, 2);
                        const mm = raw.substring(2);
                        return `${hh}:${mm}`;
                      } else {
                        const hh = raw.substring(0, 2);
                        const mm = raw.substring(2, 4);
                        const ss = raw.substring(4);
                        return `${hh}:${mm}:${ss}`;
                      }
                    })()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setSongFilters((prev) => ({ ...prev, songLengthUnder: raw }));
                      setPaginationPages((prev) => ({ ...prev, 'individualListenerSongActivity': 0 }));
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="HH:MM:SS"
                    maxLength={8}
                  />
                </div>

                {/* Song Length Over */}
                <div>
                  <label htmlFor="filter-song-length-over" className="block text-xs font-medium text-gray-600 mb-1">
                    Song Length Over:
                  </label>
                  <input
                    type="text"
                    id="filter-song-length-over"
                    value={(() => {
                      const raw = songFilters.songLengthOver;
                      if (!raw) return '';
                      if (raw.length <= 2) {
                        return raw;
                      } else if (raw.length <= 4) {
                        const hh = raw.substring(0, 2);
                        const mm = raw.substring(2);
                        return `${hh}:${mm}`;
                      } else {
                        const hh = raw.substring(0, 2);
                        const mm = raw.substring(2, 4);
                        const ss = raw.substring(4);
                        return `${hh}:${mm}:${ss}`;
                      }
                    })()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setSongFilters((prev) => ({ ...prev, songLengthOver: raw }));
                      setPaginationPages((prev) => ({ ...prev, 'individualListenerSongActivity': 0 }));
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="HH:MM:SS"
                    maxLength={8}
                  />
                </div>

                {/* Liked Filter */}
                <div>
                  <label htmlFor="filter-liked" className="block text-xs font-medium text-gray-600 mb-1">
                    Liked
                  </label>
                  <select
                    id="filter-liked"
                    value={songFilters.liked}
                    onChange={(e) => {
                      setSongFilters((prev) => ({ ...prev, liked: e.target.value }));
                      setPaginationPages((prev) => ({ ...prev, 'individualListenerSongActivity': 0 }));
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="All">All</option>
                    <option value="Liked">Liked</option>
                    <option value="Not Liked">Not Liked</option>
                  </select>
                </div>

                {/* Verified Filter */}
                <div>
                  <label htmlFor="filter-song-verified" className="block text-xs font-medium text-gray-600 mb-1">
                    Artist Verified
                  </label>
                  <select
                    id="filter-song-verified"
                    value={songFilters.verified}
                    onChange={(e) => {
                      setSongFilters((prev) => ({ ...prev, verified: e.target.value as 'Verified' | 'Not Verified' | 'All' }));
                      setPaginationPages((prev) => ({ ...prev, 'individualListenerSongActivity': 0 }));
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="All">All</option>
                    <option value="Verified">Verified</option>
                    <option value="Not Verified">Not Verified</option>
                  </select>
                </div>
              </div>

              {/* Genres Checklist */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Genres:
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
                  {uniqueGenres.length === 0 ? (
                    <p className="text-xs text-gray-500">No genres available</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {uniqueGenres.map((genre) => (
                        <label key={genre} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={songFilters.selectedGenres.includes(genre)}
                            onChange={(e) => {
                              const currentGenres = songFilters.selectedGenres;
                              const newGenres = e.target.checked
                                ? [...currentGenres, genre]
                                : currentGenres.filter(g => g !== genre);
                              setSongFilters((prev) => ({ ...prev, selectedGenres: newGenres }));
                              setPaginationPages((prev) => ({ ...prev, 'individualListenerSongActivity': 0 }));
                            }}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-xs text-gray-700">{genre}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Artists Checklist */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Artists:
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
                  {uniqueArtists.length === 0 ? (
                    <p className="text-xs text-gray-500">No artists available</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {uniqueArtists.map((artist) => (
                        <label key={artist} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={songFilters.selectedArtists.includes(artist)}
                            onChange={(e) => {
                              const currentArtists = songFilters.selectedArtists;
                              const newArtists = e.target.checked
                                ? [...currentArtists, artist]
                                : currentArtists.filter(a => a !== artist);
                              setSongFilters((prev) => ({ ...prev, selectedArtists: newArtists }));
                              setPaginationPages((prev) => ({ ...prev, 'individualListenerSongActivity': 0 }));
                            }}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-xs text-gray-700">{artist}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sort Dropdown */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-5 py-3">
            <div className="flex items-center gap-3">
              <label htmlFor="sort-individual-listener-song-activity" className="text-xs font-medium text-gray-600 whitespace-nowrap">
                Sort by:
              </label>
              <select
                id="sort-individual-listener-song-activity"
                value={individualListenerSongActivitySort}
                onChange={(e) => {
                  setIndividualListenerSongActivitySort(e.target.value);
                  setPaginationPages((prev) => ({ ...prev, 'individualListenerSongActivity': 0 }));
                }}
                className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="artistUsername-asc">Artist Username (A-Z)</option>
                <option value="artistUsername-desc">Artist Username (Z-A)</option>
                <option value="songName-asc">Song Name (A-Z)</option>
                <option value="songName-desc">Song Name (Z-A)</option>
                <option value="songLength-asc">Song Length (Shortest to Longest)</option>
                <option value="songLength-desc">Song Length (Longest to Shortest)</option>
                <option value="releaseDate-asc">Release Date (Oldest First)</option>
                <option value="releaseDate-desc">Release Date (Newest First)</option>
                <option value="totalListens-asc">Total Listens (Lowest to Highest)</option>
                <option value="totalListens-desc">Total Listens (Highest to Lowest)</option>
                <option value="averageListenDuration-asc">Average Listen Duration (Shortest to Longest)</option>
                <option value="averageListenDuration-desc">Average Listen Duration (Longest to Shortest)</option>
                <option value="totalListenDuration-asc">Total Listen Duration (Shortest to Longest)</option>
                <option value="totalListenDuration-desc">Total Listen Duration (Longest to Shortest)</option>
              </select>
            </div>
          </div>

          {songs.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg px-5 py-10 text-center text-sm text-gray-500">
              {allSongs.length === 0
                ? 'No song activity recorded for the selected period.'
                : 'No songs match the selected filters.'}
            </div>
          ) : (
            songs.map((song: any, idx: number) => {
                const listenDetails = Array.isArray(song.listenDetails) ? song.listenDetails : [];

                return (
                  <section
                    key={`${song.songId ?? idx}`}
                    className="report-section bg-white border border-gray-200 rounded-lg shadow-sm"
                  >
                    <div className="bg-gray-100 px-5 py-3.5 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{song.songName || 'Unknown Song'}</h3>
                        <p className="text-sm text-gray-600">Artist: {song.artistUsername || 'Unknown Artist'}</p>
                        <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-x-6 gap-y-1">
                          <span>Release Date: {formatDate(song.releaseDate)}</span>
                          <span>Genre: {song.genre || 'N/A'}</span>
                          <span>Song Length: {song.duration != null ? formatTime(Number(song.duration)) : 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-5 text-sm text-gray-700">
                        <div className="text-center">
                          <p className="font-semibold text-lg text-gray-900">
                            {formatNumber(Number(song.totalListens ?? listenDetails.length ?? 0))}
                          </p>
                          <p className="uppercase tracking-wide text-xs text-gray-500">Total Listens</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-lg text-gray-900">{song.liked ? 'Yes' : 'No'}</p>
                          <p className="uppercase tracking-wide text-xs text-gray-500">Liked</p>
                          {song.liked && (
                            <p className="text-[11px] text-gray-500 mt-1">
                              {song.likedAt ? `on ${formatDate(song.likedAt)}` : 'Date unavailable'}
                            </p>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-lg text-gray-900">
                            {formatTime(Number(song.averageListeningDuration ?? 0))}
                          </p>
                          <p className="uppercase tracking-wide text-xs text-gray-500">Average Listen Duration</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-lg text-gray-900">
                            {formatTime(Number(song.totalListeningDuration ?? 0))}
                          </p>
                          <p className="uppercase tracking-wide text-xs text-gray-500 whitespace-nowrap">Total Listen Duration</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-4 space-y-4">
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                          <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Listen History
                          </h5>
                          {listenDetails.length > 0 && (
                            <div className="flex items-center gap-3">
                              <label htmlFor={`sort-${song.songId ?? idx}`} className="text-xs font-medium text-gray-600 whitespace-nowrap">
                                Sort by:
                              </label>
                              <select
                                id={`sort-${song.songId ?? idx}`}
                                value={listenHistorySort[`${song.songId ?? idx}`] || 'date-desc'}
                                onChange={(e) => {
                                  const sortKey = `${song.songId ?? idx}`;
                                  setListenHistorySort((prev) => ({
                                    ...prev,
                                    [sortKey]: e.target.value
                                  }));
                                  // Reset to first page when sorting changes
                                  const paginationKey = `listenHistory-${song.songId ?? idx}`;
                                  setPaginationPages((prev) => ({
                                    ...prev,
                                    [paginationKey]: 0
                                  }));
                                }}
                                className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              >
                                <option value="date-desc">Date (Newest First)</option>
                                <option value="date-asc">Date (Oldest First)</option>
                                <option value="duration-desc">Duration (Longest First)</option>
                                <option value="duration-asc">Duration (Shortest First)</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  const historyKey = `${song.songId ?? idx}`;
                                  setExpandedListenHistory((prev) => ({
                                    ...prev,
                                    [historyKey]: !prev[historyKey]
                                  }));
                                }}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap"
                                aria-expanded={expandedListenHistory[`${song.songId ?? idx}`] ?? false}
                              >
                                {expandedListenHistory[`${song.songId ?? idx}`] ? 'Hide history' : 'Show history'}
                              </button>
                            </div>
                          )}
                        </div>
                        {listenDetails.length === 0 ? (
                          <div className="border border-dashed border-gray-300 rounded-md px-3 py-4 text-center text-sm text-gray-500">
                            No detailed listens were recorded for this song during the selected period.
                          </div>
                        ) : expandedListenHistory[`${song.songId ?? idx}`] ? (() => {
                          const sortKey = `${song.songId ?? idx}`;
                          const sortOption = listenHistorySort[sortKey] || 'date-desc';
                          
                          // Sort the listen details
                          const sortedDetails = [...listenDetails].sort((a: any, b: any) => {
                            if (sortOption === 'date-desc') {
                              return new Date(b.listenedAt || 0).getTime() - new Date(a.listenedAt || 0).getTime();
                            } else if (sortOption === 'date-asc') {
                              return new Date(a.listenedAt || 0).getTime() - new Date(b.listenedAt || 0).getTime();
                            } else if (sortOption === 'duration-desc') {
                              return Number(b.duration || 0) - Number(a.duration || 0);
                            } else if (sortOption === 'duration-asc') {
                              return Number(a.duration || 0) - Number(b.duration || 0);
                            }
                            return 0;
                          });
                          
                          // Paginate the sorted results
                          const paginationKey = `listenHistory-${song.songId ?? idx}`;
                          const { items: pagedDetails, pageInfo: listenPageInfo } = getPaginatedList(
                            sortedDetails,
                            paginationKey,
                            LISTEN_HISTORY_PAGE_SIZE
                          );
                          
                          return (
                            <div className="space-y-3">
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                                  <thead className="bg-white">
                                    <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                      <th className="px-3.5 py-2.5 text-left">Played On</th>
                                      <th className="px-3.5 py-2.5 text-left">Listen Duration</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-100">
                                    {pagedDetails.map((detail: any, listenIdx: number) => (
                                      <tr
                                        key={`${song.songId ?? idx}-listen-${listenIdx}`}
                                        className={listenIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                                      >
                                        <td className="px-3.5 py-2.5 text-sm text-gray-900">
                                          {formatDateTime(detail.listenedAt)}
                                        </td>
                                        <td className="px-3.5 py-2.5 text-sm text-gray-900">
                                          {formatTime(Number(detail.duration || 0))}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              <PaginationControls
                                pageInfo={listenPageInfo}
                                onPageChange={(page) => setPageForKey(paginationKey, page, listenPageInfo.pageCount)}
                                className="mt-2"
                              />
                            </div>
                          );
                        })() : (
                          <div className="text-sm text-gray-500">
                            Click "Show history" to reveal the listening history.
                          </div>
                        )}
                      </div>
                  </div>
                  </section>
                );
              })
          )}
          {allSongs.length > 0 && (
            <PaginationControls
              pageInfo={songPageInfo}
              onPageChange={(page) => setPageForKey('individualListenerSongActivity', page, songPageInfo.pageCount)}
              className="mt-4"
            />
          )}
        </div>
      </div>
    );
  };

  const renderAggregateSongActivity = () => {
    if (!availableSongActivity) {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          No song activity recorded for the selected period.
        </div>
      );
    }

    // Helper function to parse time to seconds (HH:MM:SS format)
    const parseTimeToSeconds = (timeStr: string): number => {
      if (!timeStr || !timeStr.trim()) return 0;
      const digitsOnly = timeStr.trim().replace(/\D/g, '');
      if (digitsOnly.length === 0) return 0;
      const padded = digitsOnly.padStart(6, '0');
      const hours = parseInt(padded.substring(0, 2), 10) || 0;
      const minutes = parseInt(padded.substring(2, 4), 10) || 0;
      const seconds = parseInt(padded.substring(4, 6), 10) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    };

    // Extract unique genres from all songs
    const allGenres = Array.from(
      new Set(
        (reportData.songActivity || [])
          .map((song: any) => song.genre)
          .filter((genre: any) => genre && String(genre).trim())
          .map((genre: any) => String(genre).trim())
      )
    ).sort() as string[];

    // Filter songs
    const allSongs = [...(reportData.songActivity || [])];
    const filteredSongs = allSongs.filter((song: any) => {
      // Artist Username filter
      if (songActivityFilters.artistUsername) {
        const artistUsername = (song.artistUsername || song.artistName || '').toLowerCase();
        const searchTerm = songActivityFilters.artistUsername.toLowerCase();
        if (!artistUsername.includes(searchTerm)) {
          return false;
        }
      }

      // Likes filter
      if (songActivityFilters.likesFilter === 'Likes') {
        if (Number(song.totalLikes || 0) === 0) {
          return false;
        }
      } else if (songActivityFilters.likesFilter === 'No Likes') {
        if (Number(song.totalLikes || 0) > 0) {
          return false;
        }
      }

      // Total Listens Under filter
      if (songActivityFilters.totalListensUnder) {
        const threshold = Number(songActivityFilters.totalListensUnder);
        if (!Number.isNaN(threshold) && Number(song.totalListens || 0) >= threshold) {
          return false;
        }
      }

      // Total Listens Over filter
      if (songActivityFilters.totalListensOver) {
        const threshold = Number(songActivityFilters.totalListensOver);
        if (!Number.isNaN(threshold) && Number(song.totalListens || 0) <= threshold) {
          return false;
        }
      }

      // Total Likes Under filter (only apply if Likes or All is selected)
      if ((songActivityFilters.likesFilter === 'Likes' || songActivityFilters.likesFilter === 'All') && songActivityFilters.totalLikesUnder) {
        const threshold = Number(songActivityFilters.totalLikesUnder);
        if (!Number.isNaN(threshold) && Number(song.totalLikes || 0) >= threshold) {
          return false;
        }
      }

      // Total Likes Over filter (only apply if Likes or All is selected)
      if ((songActivityFilters.likesFilter === 'Likes' || songActivityFilters.likesFilter === 'All') && songActivityFilters.totalLikesOver) {
        const threshold = Number(songActivityFilters.totalLikesOver);
        if (!Number.isNaN(threshold) && Number(song.totalLikes || 0) <= threshold) {
          return false;
        }
      }

      // Average Listen Duration Under filter
      if (songActivityFilters.averageListenDurationUnder) {
        const thresholdSeconds = parseTimeToSeconds(songActivityFilters.averageListenDurationUnder);
        const songDurationSeconds = Number(song.averageListeningTime || 0);
        if (thresholdSeconds > 0 && songDurationSeconds >= thresholdSeconds) {
          return false;
        }
      }

      // Average Listen Duration Over filter
      if (songActivityFilters.averageListenDurationOver) {
        const thresholdSeconds = parseTimeToSeconds(songActivityFilters.averageListenDurationOver);
        const songDurationSeconds = Number(song.averageListeningTime || 0);
        if (thresholdSeconds > 0 && songDurationSeconds <= thresholdSeconds) {
          return false;
        }
      }

      // Total Listen Duration Under filter
      if (songActivityFilters.totalListenDurationUnder) {
        const thresholdSeconds = parseTimeToSeconds(songActivityFilters.totalListenDurationUnder);
        const songDurationSeconds = Number(song.totalListeningTime || 0);
        if (thresholdSeconds > 0 && songDurationSeconds >= thresholdSeconds) {
          return false;
        }
      }

      // Total Listen Duration Over filter
      if (songActivityFilters.totalListenDurationOver) {
        const thresholdSeconds = parseTimeToSeconds(songActivityFilters.totalListenDurationOver);
        const songDurationSeconds = Number(song.totalListeningTime || 0);
        if (thresholdSeconds > 0 && songDurationSeconds <= thresholdSeconds) {
          return false;
        }
      }

      // Song Length Under filter
      if (songActivityFilters.songLengthUnder) {
        const thresholdSeconds = parseTimeToSeconds(songActivityFilters.songLengthUnder);
        const songLengthSeconds = Number(song.duration || 0);
        if (thresholdSeconds > 0 && songLengthSeconds >= thresholdSeconds) {
          return false;
        }
      }

      // Song Length Over filter
      if (songActivityFilters.songLengthOver) {
        const thresholdSeconds = parseTimeToSeconds(songActivityFilters.songLengthOver);
        const songLengthSeconds = Number(song.duration || 0);
        if (thresholdSeconds > 0 && songLengthSeconds <= thresholdSeconds) {
          return false;
        }
      }

      // Genres filter (inclusive - if any selected genre matches the song's genre, include it)
      if (songActivityFilters.selectedGenres.length > 0) {
        const songGenre = song.genre ? String(song.genre).toLowerCase().trim() : '';
        const selectedGenresLower = songActivityFilters.selectedGenres.map(g => g.toLowerCase().trim());
        if (!selectedGenresLower.includes(songGenre)) {
          return false;
        }
      }

      // Verified filter
      if (songActivityFilters.verified !== 'All') {
        const isVerified = song.artistVerified ?? false;
        if (songActivityFilters.verified === 'Verified' && !isVerified) return false;
        if (songActivityFilters.verified === 'Not Verified' && isVerified) return false;
      }

      return true;
    });

    // Sort filtered songs
    const songs = [...filteredSongs].sort((a: any, b: any) => {
      const sortOption = songActivitySort;
      let comparison = 0;

      if (sortOption === 'songName-asc') {
        comparison = (a?.songName || '').toLowerCase().localeCompare((b?.songName || '').toLowerCase());
      } else if (sortOption === 'songName-desc') {
        comparison = (b?.songName || '').toLowerCase().localeCompare((a?.songName || '').toLowerCase());
      } else if (sortOption === 'artistName-asc') {
        const artistA = (a?.artistUsername || a?.artistName || '').toLowerCase();
        const artistB = (b?.artistUsername || b?.artistName || '').toLowerCase();
        comparison = artistA.localeCompare(artistB);
      } else if (sortOption === 'artistName-desc') {
        const artistA = (a?.artistUsername || a?.artistName || '').toLowerCase();
        const artistB = (b?.artistUsername || b?.artistName || '').toLowerCase();
        comparison = artistB.localeCompare(artistA);
      } else if (sortOption === 'releaseDate-asc') {
        const dateA = a?.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const dateB = b?.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        comparison = dateA - dateB;
      } else if (sortOption === 'releaseDate-desc') {
        const dateA = a?.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const dateB = b?.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        comparison = dateB - dateA;
      } else if (sortOption === 'songLength-asc') {
        comparison = Number(a?.duration || 0) - Number(b?.duration || 0);
      } else if (sortOption === 'songLength-desc') {
        comparison = Number(b?.duration || 0) - Number(a?.duration || 0);
      } else if (sortOption === 'totalListens-asc') {
        comparison = Number(a?.totalListens || 0) - Number(b?.totalListens || 0);
      } else if (sortOption === 'totalListens-desc') {
        comparison = Number(b?.totalListens || 0) - Number(a?.totalListens || 0);
      } else if (sortOption === 'totalLikes-asc') {
        comparison = Number(a?.totalLikes || 0) - Number(b?.totalLikes || 0);
      } else if (sortOption === 'totalLikes-desc') {
        comparison = Number(b?.totalLikes || 0) - Number(a?.totalLikes || 0);
      } else if (sortOption === 'averageListenDuration-asc') {
        comparison = Number(a?.averageListeningTime || 0) - Number(b?.averageListeningTime || 0);
      } else if (sortOption === 'averageListenDuration-desc') {
        comparison = Number(b?.averageListeningTime || 0) - Number(a?.averageListeningTime || 0);
      } else if (sortOption === 'totalListenDuration-asc') {
        comparison = Number(a?.totalListeningTime || 0) - Number(b?.totalListeningTime || 0);
      } else if (sortOption === 'totalListenDuration-desc') {
        comparison = Number(b?.totalListeningTime || 0) - Number(a?.totalListeningTime || 0);
      }

      return comparison;
    });

    const { items: pagedSongs, pageInfo: songPageInfo } = getPaginatedList(
      songs,
      'songActivity',
      SONG_PAGE_SIZE
    );

    return (
      <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Song Activity</h3>
              <p className="text-xs text-gray-600">Detailed engagement for songs played during the reporting period</p>
            </div>
            <button
              type="button"
              onClick={() => setShowSongActivityFilters(!showSongActivityFilters)}
              className="px-3 py-1 text-xs font-semibold rounded-full border border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              {showSongActivityFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>
        
        {/* Song Activity Filters */}
        {showSongActivityFilters && (
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Filters</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {/* Artist Username */}
            <div>
              <label htmlFor="filter-song-artist-username" className="block text-xs font-medium text-gray-600 mb-1">
                Artist Username:
              </label>
              <input
                type="text"
                id="filter-song-artist-username"
                value={songActivityFilters.artistUsername}
                onChange={(e) => {
                  setSongActivityFilters((prev) => ({ ...prev, artistUsername: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'songActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter username"
              />
            </div>

            {/* Total Listens Under */}
            <div>
              <label htmlFor="filter-song-total-listens-under" className="block text-xs font-medium text-gray-600 mb-1">
                Total Listens Under:
              </label>
              <input
                type="number"
                id="filter-song-total-listens-under"
                min="0"
                value={songActivityFilters.totalListensUnder}
                onChange={(e) => {
                  setSongActivityFilters((prev) => ({ ...prev, totalListensUnder: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'songActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Total Listens Over */}
            <div>
              <label htmlFor="filter-song-total-listens-over" className="block text-xs font-medium text-gray-600 mb-1">
                Total Listens Over:
              </label>
              <input
                type="number"
                id="filter-song-total-listens-over"
                min="0"
                value={songActivityFilters.totalListensOver}
                onChange={(e) => {
                  setSongActivityFilters((prev) => ({ ...prev, totalListensOver: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'songActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Likes Filter */}
            <div>
              <label htmlFor="filter-song-likes" className="block text-xs font-medium text-gray-600 mb-1">
                Likes:
              </label>
              <select
                id="filter-song-likes"
                value={songActivityFilters.likesFilter}
                onChange={(e) => {
                  const newFilter = e.target.value as 'Likes' | 'No Likes' | 'All';
                  setSongActivityFilters((prev) => ({ 
                    ...prev, 
                    likesFilter: newFilter,
                    // Clear Total Likes filters if "No Likes" is selected
                    totalLikesUnder: newFilter === 'No Likes' ? '' : prev.totalLikesUnder,
                    totalLikesOver: newFilter === 'No Likes' ? '' : prev.totalLikesOver
                  }));
                  // Reset sort options for all songs if "No Likes" is selected and they were sorting by likedOn
                  if (newFilter === 'No Likes') {
                    setSongListenerSortOptions((prev) => {
                      const updated = { ...prev };
                      Object.keys(updated).forEach((key) => {
                        if (updated[key] === 'likedOn-asc' || updated[key] === 'likedOn-desc') {
                          updated[key] = 'username-asc';
                        }
                      });
                      return updated;
                    });
                  }
                  setPaginationPages((prev) => ({ ...prev, 'songActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="All">All</option>
                <option value="Likes">Likes</option>
                <option value="No Likes">No Likes</option>
              </select>
            </div>

            {/* Verified Filter */}
            <div>
              <label htmlFor="filter-song-verified-aggregate" className="block text-xs font-medium text-gray-600 mb-1">
                Artist Verified:
              </label>
              <select
                id="filter-song-verified-aggregate"
                value={songActivityFilters.verified}
                onChange={(e) => {
                  setSongActivityFilters((prev) => ({ 
                    ...prev, 
                    verified: e.target.value as 'Verified' | 'Not Verified' | 'All'
                  }));
                  setPaginationPages((prev) => ({ ...prev, 'songActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="All">All</option>
                <option value="Verified">Verified</option>
                <option value="Not Verified">Not Verified</option>
              </select>
            </div>

            {/* Total Likes Under - only show if Likes or All is selected */}
            {(songActivityFilters.likesFilter === 'Likes' || songActivityFilters.likesFilter === 'All') && (
            <div>
              <label htmlFor="filter-song-total-likes-under" className="block text-xs font-medium text-gray-600 mb-1">
                Total Likes Under:
              </label>
              <input
                type="number"
                id="filter-song-total-likes-under"
                min="0"
                value={songActivityFilters.totalLikesUnder}
                onChange={(e) => {
                  setSongActivityFilters((prev) => ({ ...prev, totalLikesUnder: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'songActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>
            )}

            {/* Total Likes Over - only show if Likes or All is selected */}
            {(songActivityFilters.likesFilter === 'Likes' || songActivityFilters.likesFilter === 'All') && (
            <div>
              <label htmlFor="filter-song-total-likes-over" className="block text-xs font-medium text-gray-600 mb-1">
                Total Likes Over:
              </label>
              <input
                type="number"
                id="filter-song-total-likes-over"
                min="0"
                value={songActivityFilters.totalLikesOver}
                onChange={(e) => {
                  setSongActivityFilters((prev) => ({ ...prev, totalLikesOver: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'songActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>
            )}

            {/* Average Listen Duration Under */}
            <div>
              <label htmlFor="filter-song-avg-listen-duration-under" className="block text-xs font-medium text-gray-600 mb-1">
                Avg Listen Duration Under:
              </label>
              <input
                type="text"
                id="filter-song-avg-listen-duration-under"
                value={(() => {
                  const raw = songActivityFilters.averageListenDurationUnder;
                  if (!raw) return '';
                  if (raw.length <= 2) {
                    return raw;
                  } else if (raw.length <= 4) {
                    const hh = raw.substring(0, 2);
                    const mm = raw.substring(2);
                    return `${hh}:${mm}`;
                  } else {
                    const hh = raw.substring(0, 2);
                    const mm = raw.substring(2, 4);
                    const ss = raw.substring(4);
                    return `${hh}:${mm}:${ss}`;
                  }
                })()}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setSongActivityFilters((prev) => ({ ...prev, averageListenDurationUnder: raw }));
                  setPaginationPages((prev) => ({ ...prev, 'songActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="HH:MM:SS"
                maxLength={8}
              />
            </div>

            {/* Average Listen Duration Over */}
            <div>
              <label htmlFor="filter-song-avg-listen-duration-over" className="block text-xs font-medium text-gray-600 mb-1">
                Avg Listen Duration Over:
              </label>
              <input
                type="text"
                id="filter-song-avg-listen-duration-over"
                value={(() => {
                  const raw = songActivityFilters.averageListenDurationOver;
                  if (!raw) return '';
                  if (raw.length <= 2) {
                    return raw;
                  } else if (raw.length <= 4) {
                    const hh = raw.substring(0, 2);
                    const mm = raw.substring(2);
                    return `${hh}:${mm}`;
                  } else {
                    const hh = raw.substring(0, 2);
                    const mm = raw.substring(2, 4);
                    const ss = raw.substring(4);
                    return `${hh}:${mm}:${ss}`;
                  }
                })()}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setSongActivityFilters((prev) => ({ ...prev, averageListenDurationOver: raw }));
                  setPaginationPages((prev) => ({ ...prev, 'songActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="HH:MM:SS"
                maxLength={8}
              />
            </div>

            {/* Total Listen Duration Under */}
            <div>
              <label htmlFor="filter-song-total-listen-duration-under" className="block text-xs font-medium text-gray-600 mb-1">
                Total Listen Duration Under:
              </label>
              <input
                type="text"
                id="filter-song-total-listen-duration-under"
                value={(() => {
                  const raw = songActivityFilters.totalListenDurationUnder;
                  if (!raw) return '';
                  if (raw.length <= 2) {
                    return raw;
                  } else if (raw.length <= 4) {
                    const hh = raw.substring(0, 2);
                    const mm = raw.substring(2);
                    return `${hh}:${mm}`;
                  } else {
                    const hh = raw.substring(0, 2);
                    const mm = raw.substring(2, 4);
                    const ss = raw.substring(4);
                    return `${hh}:${mm}:${ss}`;
                  }
                })()}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setSongActivityFilters((prev) => ({ ...prev, totalListenDurationUnder: raw }));
                  setPaginationPages((prev) => ({ ...prev, 'songActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="HH:MM:SS"
                maxLength={8}
              />
            </div>

            {/* Total Listen Duration Over */}
            <div>
              <label htmlFor="filter-song-total-listen-duration-over" className="block text-xs font-medium text-gray-600 mb-1">
                Total Listen Duration Over:
              </label>
              <input
                type="text"
                id="filter-song-total-listen-duration-over"
                value={(() => {
                  const raw = songActivityFilters.totalListenDurationOver;
                  if (!raw) return '';
                  if (raw.length <= 2) {
                    return raw;
                  } else if (raw.length <= 4) {
                    const hh = raw.substring(0, 2);
                    const mm = raw.substring(2);
                    return `${hh}:${mm}`;
                  } else {
                    const hh = raw.substring(0, 2);
                    const mm = raw.substring(2, 4);
                    const ss = raw.substring(4);
                    return `${hh}:${mm}:${ss}`;
                  }
                })()}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setSongActivityFilters((prev) => ({ ...prev, totalListenDurationOver: raw }));
                  setPaginationPages((prev) => ({ ...prev, 'songActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="HH:MM:SS"
                maxLength={8}
              />
            </div>

            {/* Song Length Under */}
            <div>
              <label htmlFor="filter-song-length-under" className="block text-xs font-medium text-gray-600 mb-1">
                Song Length Under:
              </label>
              <input
                type="text"
                id="filter-song-length-under"
                value={(() => {
                  const raw = songActivityFilters.songLengthUnder;
                  if (!raw) return '';
                  if (raw.length <= 2) {
                    return raw;
                  } else if (raw.length <= 4) {
                    const hh = raw.substring(0, 2);
                    const mm = raw.substring(2);
                    return `${hh}:${mm}`;
                  } else {
                    const hh = raw.substring(0, 2);
                    const mm = raw.substring(2, 4);
                    const ss = raw.substring(4);
                    return `${hh}:${mm}:${ss}`;
                  }
                })()}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setSongActivityFilters((prev) => ({ ...prev, songLengthUnder: raw }));
                  setPaginationPages((prev) => ({ ...prev, 'songActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="HH:MM:SS"
                maxLength={8}
              />
            </div>

            {/* Song Length Over */}
            <div>
              <label htmlFor="filter-song-length-over" className="block text-xs font-medium text-gray-600 mb-1">
                Song Length Over:
              </label>
              <input
                type="text"
                id="filter-song-length-over"
                value={(() => {
                  const raw = songActivityFilters.songLengthOver;
                  if (!raw) return '';
                  if (raw.length <= 2) {
                    return raw;
                  } else if (raw.length <= 4) {
                    const hh = raw.substring(0, 2);
                    const mm = raw.substring(2);
                    return `${hh}:${mm}`;
                  } else {
                    const hh = raw.substring(0, 2);
                    const mm = raw.substring(2, 4);
                    const ss = raw.substring(4);
                    return `${hh}:${mm}:${ss}`;
                  }
                })()}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setSongActivityFilters((prev) => ({ ...prev, songLengthOver: raw }));
                  setPaginationPages((prev) => ({ ...prev, 'songActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="HH:MM:SS"
                maxLength={8}
              />
            </div>
          </div>
          
          {/* Genres Checklist */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Genres:
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
              {allGenres.length === 0 ? (
                <p className="text-xs text-gray-500">No genres available</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {allGenres.map((genre) => (
                    <label key={genre} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={songActivityFilters.selectedGenres.includes(genre)}
                        onChange={(e) => {
                          const currentGenres = songActivityFilters.selectedGenres;
                          const newGenres = e.target.checked
                            ? [...currentGenres, genre]
                            : currentGenres.filter(g => g !== genre);
                          setSongActivityFilters((prev) => ({ ...prev, selectedGenres: newGenres }));
                          setPaginationPages((prev) => ({ ...prev, 'songActivity': 0 }));
                        }}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-xs text-gray-700">{genre}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Sorting Dropdown */}
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
          <div className="flex items-center gap-3">
            <label htmlFor="sort-song-activity" className="text-xs font-medium text-gray-600 whitespace-nowrap">
              Sort by:
            </label>
            <select
              id="sort-song-activity"
              value={songActivitySort}
              onChange={(e) => {
                setSongActivitySort(e.target.value);
                setPaginationPages((prev) => ({ ...prev, 'songActivity': 0 }));
              }}
              className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="songName-asc">Song Name (A-Z)</option>
              <option value="songName-desc">Song Name (Z-A)</option>
              <option value="artistName-asc">Artist Name (A-Z)</option>
              <option value="artistName-desc">Artist Name (Z-A)</option>
              <option value="releaseDate-asc">Release Date (Oldest First)</option>
              <option value="releaseDate-desc">Release Date (Newest First)</option>
              <option value="songLength-asc">Song Length (Shortest to Longest)</option>
              <option value="songLength-desc">Song Length (Longest to Shortest)</option>
              <option value="totalListens-asc">Total Listens (Lowest to Highest)</option>
              <option value="totalListens-desc">Total Listens (Highest to Lowest)</option>
              <option value="totalLikes-asc">Total Likes (Lowest to Highest)</option>
              <option value="totalLikes-desc">Total Likes (Highest to Lowest)</option>
              <option value="averageListenDuration-asc">Average Listen Duration (Shortest to Longest)</option>
              <option value="averageListenDuration-desc">Average Listen Duration (Longest to Shortest)</option>
              <option value="totalListenDuration-asc">Total Listen Duration (Shortest to Longest)</option>
              <option value="totalListenDuration-desc">Total Listen Duration (Longest to Shortest)</option>
            </select>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {filteredSongs.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg px-5 py-8 text-center text-sm text-gray-500">
              {reportData.songActivity && reportData.songActivity.length > 0
                ? 'No songs match the selected filters.'
                : 'No song activity recorded for the selected period.'}
            </div>
          ) : (
            <>
              {pagedSongs.map((song: any, idx: number) => {
            const listenerDetails: any[] = Array.isArray(song.listenerDetails) ? song.listenerDetails : [];
            const songKey = `song-${song.songId ?? idx}`;
            const listenersExpanded = expandedSongListeners[songKey] ?? false;
            
            // Sort listeners
            let listenerSortOption = songListenerSortOptions[songKey] || 'username-asc';
            // Reset to default if "No Likes" is selected and sort option is likedOn
            if (songActivityFilters.likesFilter === 'No Likes' && (listenerSortOption === 'likedOn-asc' || listenerSortOption === 'likedOn-desc')) {
              listenerSortOption = 'username-asc';
            }
            const sortedListenerDetails = [...listenerDetails].sort((a: any, b: any) => {
              // Separate liked and not liked listeners (only if not filtering by "No Likes")
              if (songActivityFilters.likesFilter !== 'No Likes') {
                const aLiked = a?.liked === true;
                const bLiked = b?.liked === true;
                
                // If one is liked and the other isn't, the not-liked one goes to the bottom
                if (aLiked && !bLiked) return -1;
                if (!aLiked && bLiked) return 1;
              }
              
              // Both are liked or both are not liked, sort normally
              let comparison = 0;
              
              if (listenerSortOption === 'username-asc') {
                comparison = (a?.username || '').toLowerCase().localeCompare((b?.username || '').toLowerCase());
              } else if (listenerSortOption === 'username-desc') {
                comparison = (b?.username || '').toLowerCase().localeCompare((a?.username || '').toLowerCase());
              } else if (listenerSortOption === 'listens-asc') {
                comparison = Number(a?.listenCount || 0) - Number(b?.listenCount || 0);
              } else if (listenerSortOption === 'listens-desc') {
                comparison = Number(b?.listenCount || 0) - Number(a?.listenCount || 0);
              } else if (listenerSortOption === 'avgListenDuration-asc') {
                comparison = Number(a?.averageListeningTime || 0) - Number(b?.averageListeningTime || 0);
              } else if (listenerSortOption === 'avgListenDuration-desc') {
                comparison = Number(b?.averageListeningTime || 0) - Number(a?.averageListeningTime || 0);
              } else if (listenerSortOption === 'totalListenDuration-asc') {
                comparison = Number(a?.totalListeningTime || 0) - Number(b?.totalListeningTime || 0);
              } else if (listenerSortOption === 'totalListenDuration-desc') {
                comparison = Number(b?.totalListeningTime || 0) - Number(a?.totalListeningTime || 0);
              } else if (listenerSortOption === 'likedOn-asc' && songActivityFilters.likesFilter !== 'No Likes') {
                const dateA = a?.likedAt ? new Date(a.likedAt).getTime() : 0;
                const dateB = b?.likedAt ? new Date(b.likedAt).getTime() : 0;
                comparison = dateA - dateB;
              } else if (listenerSortOption === 'likedOn-desc' && songActivityFilters.likesFilter !== 'No Likes') {
                const dateA = a?.likedAt ? new Date(a.likedAt).getTime() : 0;
                const dateB = b?.likedAt ? new Date(b.likedAt).getTime() : 0;
                comparison = dateB - dateA;
              }
              
              return comparison;
            });
            const toggleListeners = () => {
              setExpandedSongListeners((prev) => ({
                ...prev,
                [songKey]: !prev[songKey]
              }));
            };
            const columnVisibility = songListenerColumnVisibility[songKey] ?? { showAvgDuration: false, showTotalDuration: false };
            const toggleAvgDuration = () => {
              setSongListenerColumnVisibility((prev) => ({
                ...prev,
                [songKey]: {
                  ...(prev[songKey] ?? { showAvgDuration: false, showTotalDuration: false }),
                  showAvgDuration: !(prev[songKey]?.showAvgDuration ?? false)
                }
              }));
            };
            const toggleTotalDuration = () => {
              setSongListenerColumnVisibility((prev) => ({
                ...prev,
                [songKey]: {
                  ...(prev[songKey] ?? { showAvgDuration: false, showTotalDuration: false }),
                  showTotalDuration: !(prev[songKey]?.showTotalDuration ?? false)
                }
              }));
            };

            return (
              <section
                key={`${song.songId ?? idx}`}
                className="report-section bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <div className="bg-gray-100 px-5 py-3.5 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{song.songName || 'Unknown Song'}</h3>
                    <p className="text-sm text-gray-600">Artist: {song.artistName || 'Unknown Artist'}</p>
                    <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-x-6 gap-y-1">
                      <span>Release Date: {formatDate(song.releaseDate)}</span>
                      <span>Genre: {song.genre || 'N/A'}</span>
                      <span>Song Length: {song.duration != null ? formatTime(Number(song.duration)) : 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-5 text-sm text-gray-700">
                    <div className="text-center">
                      <p className="font-semibold text-lg text-gray-900">
                        {formatNumber(Number(song.totalListens ?? 0))}
                      </p>
                      <p className="uppercase tracking-wide text-xs text-gray-500">Total Listens</p>
                    </div>
                    {songActivityFilters.likesFilter !== 'No Likes' && (
                    <div className="text-center">
                      <p className="font-semibold text-lg text-gray-900">
                        {formatNumber(Number(song.totalLikes ?? 0))}
                      </p>
                      <p className="uppercase tracking-wide text-xs text-gray-500">Total Likes</p>
                    </div>
                    )}
                    <div className="text-center">
                      <p className="font-semibold text-lg text-gray-900">
                        {formatTime(Number(song.averageListeningTime ?? 0))}
                      </p>
                      <p className="uppercase tracking-wide text-xs text-gray-500">Average Listen Duration</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-lg text-gray-900">
                        {formatTime(Number(song.totalListeningTime ?? 0))}
                      </p>
                      <p className="uppercase tracking-wide text-xs text-gray-500 whitespace-nowrap">Total Listen Duration</p>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Listeners</h5>
                    {listenerDetails.length > 0 && (
                      <div className="flex items-center gap-2">
                        <label htmlFor={`sort-listeners-${songKey}`} className="text-xs font-medium text-gray-600 whitespace-nowrap">
                          Sort by:
                        </label>
                        <select
                          id={`sort-listeners-${songKey}`}
                          value={(() => {
                            const currentSort = songListenerSortOptions[songKey] || 'username-asc';
                            // Reset to default if "No Likes" is selected and sort option is likedOn
                            if (songActivityFilters.likesFilter === 'No Likes' && (currentSort === 'likedOn-asc' || currentSort === 'likedOn-desc')) {
                              return 'username-asc';
                            }
                            return currentSort;
                          })()}
                          onChange={(e) => {
                            setSongListenerSortOptions((prev) => ({
                              ...prev,
                              [songKey]: e.target.value
                            }));
                          }}
                          className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <option value="username-asc">Username (A-Z)</option>
                          <option value="username-desc">Username (Z-A)</option>
                          <option value="listens-asc">Listens (Lowest to Highest)</option>
                          <option value="listens-desc">Listens (Highest to Lowest)</option>
                          <option value="avgListenDuration-asc">Avg Listen Duration (Shortest to Longest)</option>
                          <option value="avgListenDuration-desc">Avg Listen Duration (Longest to Shortest)</option>
                          <option value="totalListenDuration-asc">Total Listen Duration (Shortest to Longest)</option>
                          <option value="totalListenDuration-desc">Total Listen Duration (Longest to Shortest)</option>
                          {songActivityFilters.likesFilter !== 'No Likes' && (
                            <>
                              <option value="likedOn-asc">Liked On (Oldest First)</option>
                              <option value="likedOn-desc">Liked On (Newest First)</option>
                            </>
                          )}
                        </select>
                        <button
                          type="button"
                          onClick={toggleAvgDuration}
                          className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                            columnVisibility.showAvgDuration
                              ? 'border-red-600 text-red-600 bg-red-50'
                              : 'border-gray-300 text-gray-600 bg-white'
                          }`}
                        >
                          {columnVisibility.showAvgDuration ? 'Hide Avg Listen Duration' : 'Show Avg Listen Duration'}
                        </button>
                        <button
                          type="button"
                          onClick={toggleTotalDuration}
                          className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                            columnVisibility.showTotalDuration
                              ? 'border-red-600 text-red-600 bg-red-50'
                              : 'border-gray-300 text-gray-600 bg-white'
                          }`}
                        >
                          {columnVisibility.showTotalDuration ? 'Hide Total Listen Duration' : 'Show Total Listen Duration'}
                        </button>
                        <button
                          type="button"
                          onClick={toggleListeners}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          aria-expanded={listenersExpanded}
                        >
                          {listenersExpanded ? 'Hide listeners' : 'Show listeners'}
                        </button>
                      </div>
                    )}
                  </div>
                  {listenerDetails.length === 0 ? (
                    <div className="border border-dashed border-gray-300 rounded-md px-3 py-4 text-center text-sm text-gray-500">
                      No listener details were recorded for this song during the selected period.
                    </div>
                  ) : listenersExpanded ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                        <thead className="bg-gray-50">
                          <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <th className="px-3.5 py-2.5 text-left">Listener</th>
                            <th className="px-3.5 py-2.5 text-center">Listens</th>
                            {columnVisibility.showAvgDuration && (
                              <th className="px-3.5 py-2.5 text-center">Avg Listen Duration</th>
                            )}
                            {columnVisibility.showTotalDuration && (
                              <th className="px-3.5 py-2.5 text-center">Total Listen Duration</th>
                            )}
                            {songActivityFilters.likesFilter !== 'No Likes' && (
                              <>
                                <th className="px-3.5 py-2.5 text-left">Liked?</th>
                                <th className="px-3.5 py-2.5 text-left">Liked On</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {sortedListenerDetails.map((listener: any, listenerIdx: number) => (
                            <tr
                              key={`${song.songId ?? idx}-listener-${listenerIdx}`}
                              className={listenerIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                            >
                              <td className="px-3.5 py-2.5 text-sm text-gray-900">{listener.username || 'Unknown User'}</td>
                              <td className="px-3.5 py-2.5 text-sm text-gray-900 text-center">{formatNumber(listener.listenCount || 0)}</td>
                              {columnVisibility.showAvgDuration && (
                                <td className="px-3.5 py-2.5 text-sm text-gray-900 text-center">{formatTime(listener.averageListeningTime || 0)}</td>
                              )}
                              {columnVisibility.showTotalDuration && (
                                <td className="px-3.5 py-2.5 text-sm text-gray-900 text-center">{formatTime(listener.totalListeningTime || 0)}</td>
                              )}
                              {songActivityFilters.likesFilter !== 'No Likes' && (
                                <>
                                  <td className="px-3.5 py-2.5 text-sm text-gray-900">{listener.liked ? 'Liked' : 'Not Liked'}</td>
                                  <td className="px-3.5 py-2.5 text-sm text-gray-900">{formatDate(listener.likedAt)}</td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Click “Show listeners” to reveal this list.
                    </div>
                  )}
                </div>
              </section>
            );
          })}
            </>
          )}
        </div>
        {filteredSongs.length > 0 && (
          <PaginationControls
            pageInfo={songPageInfo}
            onPageChange={(page) => setPageForKey('songActivity', page, songPageInfo.pageCount)}
            className="mt-4 px-5"
          />
        )}
      </div>
    );
  };

  const renderArtistActivity = () => {
    if (isIndividualUser) {
      const userType = reportData.userDetails?.userType;
      if (userType === 'Listener') {
        return renderIndividualListenerArtistActivity();
      }
    return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          Artist activity is only available for listener accounts.
        </div>
      );
    }

    if (!availableArtistActivity) {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          No artist activity recorded for the selected period.
        </div>
      );
    }

    // Helper function to parse HHMMSS format (e.g., "013030" = 01:30:30) to seconds
    const parseTimeToSeconds = (timeStr: string): number => {
      if (!timeStr || !timeStr.trim()) return 0;
      // Remove any non-numeric characters
      const digitsOnly = timeStr.trim().replace(/\D/g, '');
      if (digitsOnly.length === 0) return 0;
      
      // Pad to 6 digits if needed (HHMMSS format)
      const padded = digitsOnly.padStart(6, '0');
      const hours = parseInt(padded.substring(0, 2), 10) || 0;
      const minutes = parseInt(padded.substring(2, 4), 10) || 0;
      const seconds = parseInt(padded.substring(4, 6), 10) || 0;
      
      return hours * 3600 + minutes * 60 + seconds;
    };
    
    // Helper function to convert total listen duration to seconds
    const getTotalListenDurationInSeconds = (artist: any): number => {
      // totalListeningDuration is already in seconds according to the interface
      return Number(artist.totalListeningDuration || 0);
    };
    
    // Helper function to calculate age from date of birth
    const calculateAge = (dateOfBirth: string | null | undefined): number | null => {
      if (!dateOfBirth) return null;
      const birthDate = new Date(dateOfBirth);
      if (isNaN(birthDate.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };
    
    // Extract unique genres from all artists
    const allGenres = Array.from(
      new Set(
        (reportData.artistActivity || [])
          .flatMap((artist: any) => {
            if (Array.isArray(artist.genres)) {
              return artist.genres.filter((g: any) => g && String(g).trim());
            }
            return [];
          })
      )
    ).sort() as string[];
    
    // Extract unique countries for artists
    const artistCountries = Array.from(
      new Set(
        (reportData.artistActivity || [])
          .map((artist: any) => artist.country)
          .filter((country: any) => country)
      )
    ).sort() as string[];
    
    // Extract cities for artists based on selected country
    const artistCities = Array.from(
      new Set(
        (reportData.artistActivity || [])
          .filter((artist: any) => 
            aggregateArtistActivityFilters.country === 'All Countries' || artist.country === aggregateArtistActivityFilters.country
          )
          .map((artist: any) => artist.city)
          .filter((city: any) => city)
      )
    ).sort() as string[];
    
    // Filter artists
    const filteredArtists = [...reportData.artistActivity].filter((artist: any) => {
      // Songs Released Under filter
      if (aggregateArtistActivityFilters.songsReleasedUnder) {
        const threshold = Number(aggregateArtistActivityFilters.songsReleasedUnder);
        if (!Number.isNaN(threshold) && Number(artist.songsReleased || 0) >= threshold) {
          return false;
        }
      }
      // Songs Released Over filter
      if (aggregateArtistActivityFilters.songsReleasedOver) {
        const threshold = Number(aggregateArtistActivityFilters.songsReleasedOver);
        if (!Number.isNaN(threshold) && Number(artist.songsReleased || 0) <= threshold) {
          return false;
        }
      }
      // Albums Released Under filter
      if (aggregateArtistActivityFilters.albumsReleasedUnder) {
        const threshold = Number(aggregateArtistActivityFilters.albumsReleasedUnder);
        if (!Number.isNaN(threshold) && Number(artist.albumsReleased || 0) >= threshold) {
          return false;
        }
      }
      // Albums Released Over filter
      if (aggregateArtistActivityFilters.albumsReleasedOver) {
        const threshold = Number(aggregateArtistActivityFilters.albumsReleasedOver);
        if (!Number.isNaN(threshold) && Number(artist.albumsReleased || 0) <= threshold) {
          return false;
        }
      }
      // Total Listens Under filter
      if (aggregateArtistActivityFilters.totalListensUnder) {
        const threshold = Number(aggregateArtistActivityFilters.totalListensUnder);
        if (!Number.isNaN(threshold) && Number(artist.totalListens || 0) >= threshold) {
          return false;
        }
      }
      // Total Listens Over filter
      if (aggregateArtistActivityFilters.totalListensOver) {
        const threshold = Number(aggregateArtistActivityFilters.totalListensOver);
        if (!Number.isNaN(threshold) && Number(artist.totalListens || 0) <= threshold) {
          return false;
        }
      }
      // Song Likes Under filter
      if (aggregateArtistActivityFilters.songLikesUnder) {
        const threshold = Number(aggregateArtistActivityFilters.songLikesUnder);
        if (!Number.isNaN(threshold) && Number(artist.totalSongLikes || 0) >= threshold) {
          return false;
        }
      }
      // Song Likes Over filter
      if (aggregateArtistActivityFilters.songLikesOver) {
        const threshold = Number(aggregateArtistActivityFilters.songLikesOver);
        if (!Number.isNaN(threshold) && Number(artist.totalSongLikes || 0) <= threshold) {
          return false;
        }
      }
      // Album Likes Under filter
      if (aggregateArtistActivityFilters.albumLikesUnder) {
        const threshold = Number(aggregateArtistActivityFilters.albumLikesUnder);
        if (!Number.isNaN(threshold) && Number(artist.totalAlbumLikes || 0) >= threshold) {
          return false;
        }
      }
      // Album Likes Over filter
      if (aggregateArtistActivityFilters.albumLikesOver) {
        const threshold = Number(aggregateArtistActivityFilters.albumLikesOver);
        if (!Number.isNaN(threshold) && Number(artist.totalAlbumLikes || 0) <= threshold) {
          return false;
        }
      }
      // Total Listen Duration Under filter
      if (aggregateArtistActivityFilters.totalListenDurationUnder) {
        const thresholdSeconds = parseTimeToSeconds(aggregateArtistActivityFilters.totalListenDurationUnder);
        const artistDurationSeconds = getTotalListenDurationInSeconds(artist);
        if (thresholdSeconds > 0 && artistDurationSeconds >= thresholdSeconds) {
          return false;
        }
      }
      // Total Listen Duration Over filter
      if (aggregateArtistActivityFilters.totalListenDurationOver) {
        const thresholdSeconds = parseTimeToSeconds(aggregateArtistActivityFilters.totalListenDurationOver);
        const artistDurationSeconds = getTotalListenDurationInSeconds(artist);
        if (thresholdSeconds > 0 && artistDurationSeconds <= thresholdSeconds) {
          return false;
        }
      }
      
      // Age Under filter
      if (aggregateArtistActivityFilters.ageUnder) {
        const threshold = Number(aggregateArtistActivityFilters.ageUnder);
        const artistAge = artist.age != null ? Number(artist.age) : calculateAge(artist.dateOfBirth);
        if (!Number.isNaN(threshold) && artistAge != null && artistAge >= threshold) {
          return false;
        }
      }
      
      // Age Over filter
      if (aggregateArtistActivityFilters.ageOver) {
        const threshold = Number(aggregateArtistActivityFilters.ageOver);
        const artistAge = artist.age != null ? Number(artist.age) : calculateAge(artist.dateOfBirth);
        if (!Number.isNaN(threshold) && artistAge != null && artistAge <= threshold) {
          return false;
        }
      }
      
      // Country filter
      if (aggregateArtistActivityFilters.country !== 'All Countries' && artist.country !== aggregateArtistActivityFilters.country) {
        return false;
      }
      
      // City filter
      if (aggregateArtistActivityFilters.city !== 'All Cities' && artist.city !== aggregateArtistActivityFilters.city) {
        return false;
      }
      
      // Genres filter (inclusive - if any selected genre matches any of the artist's genres, include them)
      if (aggregateArtistActivityFilters.selectedGenres.length > 0) {
        const artistGenres = Array.isArray(artist.genres) 
          ? artist.genres.map((g: any) => String(g).toLowerCase().trim())
          : [];
        const selectedGenresLower = aggregateArtistActivityFilters.selectedGenres.map(g => g.toLowerCase().trim());
        const hasMatchingGenre = selectedGenresLower.some(selectedGenre => 
          artistGenres.some((artistGenre: string) => artistGenre === selectedGenre)
        );
        if (!hasMatchingGenre) {
          return false;
        }
      }
      
      return true;
    });
    
    // Sort filtered artists
    const artists = [...filteredArtists].sort((a: any, b: any) => {
      const sortOption = aggregateArtistActivitySort;
      
      if (sortOption === 'username-asc') {
        return (a.username || '').toLowerCase().localeCompare((b.username || '').toLowerCase());
      } else if (sortOption === 'username-desc') {
        return (b.username || '').toLowerCase().localeCompare((a.username || '').toLowerCase());
      } else if (sortOption === 'age-asc') {
        const ageA = a.age != null ? Number(a.age) : calculateAge(a.dateOfBirth) ?? 0;
        const ageB = b.age != null ? Number(b.age) : calculateAge(b.dateOfBirth) ?? 0;
        return ageA - ageB;
      } else if (sortOption === 'age-desc') {
        const ageA = a.age != null ? Number(a.age) : calculateAge(a.dateOfBirth) ?? 0;
        const ageB = b.age != null ? Number(b.age) : calculateAge(b.dateOfBirth) ?? 0;
        return ageB - ageA;
      } else if (sortOption === 'songsReleased-asc') {
        return Number(a.songsReleased || 0) - Number(b.songsReleased || 0);
      } else if (sortOption === 'songsReleased-desc') {
        return Number(b.songsReleased || 0) - Number(a.songsReleased || 0);
      } else if (sortOption === 'albumsReleased-asc') {
        return Number(a.albumsReleased || 0) - Number(b.albumsReleased || 0);
      } else if (sortOption === 'albumsReleased-desc') {
        return Number(b.albumsReleased || 0) - Number(a.albumsReleased || 0);
      } else if (sortOption === 'totalListens-asc') {
        return Number(a.totalListens || 0) - Number(b.totalListens || 0);
      } else if (sortOption === 'totalListens-desc') {
        return Number(b.totalListens || 0) - Number(a.totalListens || 0);
      } else if (sortOption === 'songLikes-asc') {
        return Number(a.totalSongLikes || 0) - Number(b.totalSongLikes || 0);
      } else if (sortOption === 'songLikes-desc') {
        return Number(b.totalSongLikes || 0) - Number(a.totalSongLikes || 0);
      } else if (sortOption === 'albumLikes-asc') {
        return Number(a.totalAlbumLikes || 0) - Number(b.totalAlbumLikes || 0);
      } else if (sortOption === 'albumLikes-desc') {
        return Number(b.totalAlbumLikes || 0) - Number(a.totalAlbumLikes || 0);
      } else if (sortOption === 'totalListenDuration-asc') {
        const durationA = getTotalListenDurationInSeconds(a);
        const durationB = getTotalListenDurationInSeconds(b);
        return durationA - durationB;
      } else if (sortOption === 'totalListenDuration-desc') {
        const durationA = getTotalListenDurationInSeconds(a);
        const durationB = getTotalListenDurationInSeconds(b);
        return durationB - durationA;
      } else if (sortOption === 'dateJoined-asc') {
        const dateA = a.dateJoined ? new Date(a.dateJoined).getTime() : 0;
        const dateB = b.dateJoined ? new Date(b.dateJoined).getTime() : 0;
        return dateA - dateB;
      } else if (sortOption === 'dateJoined-desc') {
        const dateA = a.dateJoined ? new Date(a.dateJoined).getTime() : 0;
        const dateB = b.dateJoined ? new Date(b.dateJoined).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });
    const { items: pagedArtists, pageInfo: artistPageInfo } = getPaginatedList(
      artists,
      'artistActivity',
      ARTIST_PAGE_SIZE
    );

    return (
      <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Artist Activity</h3>
              <p className="text-xs text-gray-600">Key metrics for artists included in this report</p>
            </div>
            <button
              type="button"
              onClick={() => setShowArtistActivityFilters(!showArtistActivityFilters)}
              className="px-3 py-1 text-xs font-semibold rounded-full border border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              {showArtistActivityFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>
        
        {/* Aggregate Artist Activity Sort */}
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
          <div className="flex items-center gap-3">
            <label htmlFor="aggregate-artist-activity-sort" className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Sort by:
            </label>
            <select
              id="aggregate-artist-activity-sort"
              value={aggregateArtistActivitySort}
              onChange={(e) => {
                setAggregateArtistActivitySort(e.target.value);
                setPaginationPages((prev) => ({ ...prev, 'artistActivity': 0 }));
              }}
              className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="username-asc">Username (A-Z)</option>
              <option value="username-desc">Username (Z-A)</option>
              <option value="age-asc">Age (Youngest to Oldest)</option>
              <option value="age-desc">Age (Oldest to Youngest)</option>
              <option value="songsReleased-asc">Songs Released (Low to High)</option>
              <option value="songsReleased-desc">Songs Released (High to Low)</option>
              <option value="albumsReleased-asc">Albums Released (Low to High)</option>
              <option value="albumsReleased-desc">Albums Released (High to Low)</option>
              <option value="totalListens-asc">Total Listens (Low to High)</option>
              <option value="totalListens-desc">Total Listens (High to Low)</option>
              <option value="songLikes-asc">Song Likes (Low to High)</option>
              <option value="songLikes-desc">Song Likes (High to Low)</option>
              <option value="albumLikes-asc">Album Likes (Low to High)</option>
              <option value="albumLikes-desc">Album Likes (High to Low)</option>
              <option value="totalListenDuration-asc">Total Listen Duration (Shortest to Longest)</option>
              <option value="totalListenDuration-desc">Total Listen Duration (Longest to Shortest)</option>
              <option value="dateJoined-asc">Date Joined (Oldest First)</option>
              <option value="dateJoined-desc">Date Joined (Newest First)</option>
            </select>
          </div>
        </div>
        
        {/* Aggregate Artist Activity Filters */}
        {showArtistActivityFilters && (
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-4">
          <h5 className="text-xs font-semibold text-gray-700 mb-3">Filters</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Songs Released Under */}
            <div>
              <label htmlFor="filter-aggregate-songs-released-under" className="block text-xs font-medium text-gray-600 mb-1">
                Songs Released Under:
              </label>
              <input
                type="number"
                id="filter-aggregate-songs-released-under"
                min="0"
                value={aggregateArtistActivityFilters.songsReleasedUnder}
                onChange={(e) => {
                  setAggregateArtistActivityFilters((prev) => ({ ...prev, songsReleasedUnder: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'artistActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Songs Released Over */}
            <div>
              <label htmlFor="filter-aggregate-songs-released-over" className="block text-xs font-medium text-gray-600 mb-1">
                Songs Released Over:
              </label>
              <input
                type="number"
                id="filter-aggregate-songs-released-over"
                min="0"
                value={aggregateArtistActivityFilters.songsReleasedOver}
                onChange={(e) => {
                  setAggregateArtistActivityFilters((prev) => ({ ...prev, songsReleasedOver: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'artistActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Albums Released Under */}
            <div>
              <label htmlFor="filter-aggregate-albums-released-under" className="block text-xs font-medium text-gray-600 mb-1">
                Albums Released Under:
              </label>
              <input
                type="number"
                id="filter-aggregate-albums-released-under"
                min="0"
                value={aggregateArtistActivityFilters.albumsReleasedUnder}
                onChange={(e) => {
                  setAggregateArtistActivityFilters((prev) => ({ ...prev, albumsReleasedUnder: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'artistActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Albums Released Over */}
            <div>
              <label htmlFor="filter-aggregate-albums-released-over" className="block text-xs font-medium text-gray-600 mb-1">
                Albums Released Over:
              </label>
              <input
                type="number"
                id="filter-aggregate-albums-released-over"
                min="0"
                value={aggregateArtistActivityFilters.albumsReleasedOver}
                onChange={(e) => {
                  setAggregateArtistActivityFilters((prev) => ({ ...prev, albumsReleasedOver: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'artistActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Total Listens Under */}
            <div>
              <label htmlFor="filter-aggregate-total-listens-under" className="block text-xs font-medium text-gray-600 mb-1">
                Total Listens Under:
              </label>
              <input
                type="number"
                id="filter-aggregate-total-listens-under"
                min="0"
                value={aggregateArtistActivityFilters.totalListensUnder}
                onChange={(e) => {
                  setAggregateArtistActivityFilters((prev) => ({ ...prev, totalListensUnder: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'artistActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Total Listens Over */}
            <div>
              <label htmlFor="filter-aggregate-total-listens-over" className="block text-xs font-medium text-gray-600 mb-1">
                Total Listens Over:
              </label>
              <input
                type="number"
                id="filter-aggregate-total-listens-over"
                min="0"
                value={aggregateArtistActivityFilters.totalListensOver}
                onChange={(e) => {
                  setAggregateArtistActivityFilters((prev) => ({ ...prev, totalListensOver: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'artistActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Song Likes Under */}
            <div>
              <label htmlFor="filter-aggregate-song-likes-under" className="block text-xs font-medium text-gray-600 mb-1">
                Song Likes Under:
              </label>
              <input
                type="number"
                id="filter-aggregate-song-likes-under"
                min="0"
                value={aggregateArtistActivityFilters.songLikesUnder}
                onChange={(e) => {
                  setAggregateArtistActivityFilters((prev) => ({ ...prev, songLikesUnder: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'artistActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Song Likes Over */}
            <div>
              <label htmlFor="filter-aggregate-song-likes-over" className="block text-xs font-medium text-gray-600 mb-1">
                Song Likes Over:
              </label>
              <input
                type="number"
                id="filter-aggregate-song-likes-over"
                min="0"
                value={aggregateArtistActivityFilters.songLikesOver}
                onChange={(e) => {
                  setAggregateArtistActivityFilters((prev) => ({ ...prev, songLikesOver: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'artistActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Album Likes Under */}
            <div>
              <label htmlFor="filter-aggregate-album-likes-under" className="block text-xs font-medium text-gray-600 mb-1">
                Album Likes Under:
              </label>
              <input
                type="number"
                id="filter-aggregate-album-likes-under"
                min="0"
                value={aggregateArtistActivityFilters.albumLikesUnder}
                onChange={(e) => {
                  setAggregateArtistActivityFilters((prev) => ({ ...prev, albumLikesUnder: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'artistActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Album Likes Over */}
            <div>
              <label htmlFor="filter-aggregate-album-likes-over" className="block text-xs font-medium text-gray-600 mb-1">
                Album Likes Over:
              </label>
              <input
                type="number"
                id="filter-aggregate-album-likes-over"
                min="0"
                value={aggregateArtistActivityFilters.albumLikesOver}
                onChange={(e) => {
                  setAggregateArtistActivityFilters((prev) => ({ ...prev, albumLikesOver: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'artistActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Total Listen Duration Under */}
            <div>
              <label htmlFor="filter-aggregate-total-listen-duration-under" className="block text-xs font-medium text-gray-600 mb-1">
                Total Listen Duration Under:
              </label>
              <input
                type="text"
                id="filter-aggregate-total-listen-duration-under"
                value={(() => {
                  const raw = aggregateArtistActivityFilters.totalListenDurationUnder;
                  if (!raw) return '';
                  // Format as HH:MM:SS based on actual input length
                  if (raw.length <= 2) {
                    return raw; // Just show what they typed (e.g., "0" or "01")
                  } else if (raw.length <= 4) {
                    const hh = raw.substring(0, 2);
                    const mm = raw.substring(2);
                    return `${hh}:${mm}`; // e.g., "01:3" or "01:30"
                  } else {
                    const hh = raw.substring(0, 2);
                    const mm = raw.substring(2, 4);
                    const ss = raw.substring(4);
                    return `${hh}:${mm}:${ss}`; // e.g., "01:30:3" or "01:30:30"
                  }
                })()}
                onChange={(e) => {
                  // Remove all non-numeric characters
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setAggregateArtistActivityFilters((prev) => ({ ...prev, totalListenDurationUnder: raw }));
                  setPaginationPages((prev) => ({ ...prev, 'artistActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="HH:MM:SS"
                maxLength={8}
              />
            </div>

            {/* Total Listen Duration Over */}
            <div>
              <label htmlFor="filter-aggregate-total-listen-duration-over" className="block text-xs font-medium text-gray-600 mb-1">
                Total Listen Duration Over:
              </label>
              <input
                type="text"
                id="filter-aggregate-total-listen-duration-over"
                value={(() => {
                  const raw = aggregateArtistActivityFilters.totalListenDurationOver;
                  if (!raw) return '';
                  // Format as HH:MM:SS based on actual input length
                  if (raw.length <= 2) {
                    return raw; // Just show what they typed (e.g., "0" or "01")
                  } else if (raw.length <= 4) {
                    const hh = raw.substring(0, 2);
                    const mm = raw.substring(2);
                    return `${hh}:${mm}`; // e.g., "01:3" or "01:30"
                  } else {
                    const hh = raw.substring(0, 2);
                    const mm = raw.substring(2, 4);
                    const ss = raw.substring(4);
                    return `${hh}:${mm}:${ss}`; // e.g., "01:30:3" or "01:30:30"
                  }
                })()}
                onChange={(e) => {
                  // Remove all non-numeric characters
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setAggregateArtistActivityFilters((prev) => ({ ...prev, totalListenDurationOver: raw }));
                  setPaginationPages((prev) => ({ ...prev, 'artistActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="HH:MM:SS"
                maxLength={8}
              />
            </div>

            {/* Age Under */}
            <div>
              <label htmlFor="filter-aggregate-age-under" className="block text-xs font-medium text-gray-600 mb-1">
                Age Under:
              </label>
              <input
                type="number"
                id="filter-aggregate-age-under"
                min="0"
                value={aggregateArtistActivityFilters.ageUnder}
                onChange={(e) => {
                  setAggregateArtistActivityFilters((prev) => ({ ...prev, ageUnder: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'artistActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Age Over */}
            <div>
              <label htmlFor="filter-aggregate-age-over" className="block text-xs font-medium text-gray-600 mb-1">
                Age Over:
              </label>
              <input
                type="number"
                id="filter-aggregate-age-over"
                min="0"
                value={aggregateArtistActivityFilters.ageOver}
                onChange={(e) => {
                  setAggregateArtistActivityFilters((prev) => ({ ...prev, ageOver: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'artistActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            {/* Country */}
            <div>
              <label htmlFor="filter-aggregate-country" className="block text-xs font-medium text-gray-600 mb-1">
                Country:
              </label>
              <select
                id="filter-aggregate-country"
                value={aggregateArtistActivityFilters.country}
                onChange={(e) => {
                  setAggregateArtistActivityFilters((prev) => ({ 
                    ...prev, 
                    country: e.target.value,
                    city: 'All Cities' // Reset city when country changes
                  }));
                  setPaginationPages((prev) => ({ ...prev, 'artistActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="All Countries">All Countries</option>
                {artistCountries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label htmlFor="filter-aggregate-city" className="block text-xs font-medium text-gray-600 mb-1">
                City:
              </label>
              <select
                id="filter-aggregate-city"
                value={aggregateArtistActivityFilters.city}
                onChange={(e) => {
                  setAggregateArtistActivityFilters((prev) => ({ ...prev, city: e.target.value }));
                  setPaginationPages((prev) => ({ ...prev, 'artistActivity': 0 }));
                }}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={aggregateArtistActivityFilters.country === 'All Countries' && artistCities.length === 0}
              >
                <option value="All Cities">All Cities</option>
                {artistCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Genres Checklist */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Genres:
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
              {allGenres.length === 0 ? (
                <p className="text-xs text-gray-500">No genres available</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {allGenres.map((genre) => (
                    <label key={genre} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={aggregateArtistActivityFilters.selectedGenres.includes(genre)}
                        onChange={(e) => {
                          const currentGenres = aggregateArtistActivityFilters.selectedGenres;
                          const newGenres = e.target.checked
                            ? [...currentGenres, genre]
                            : currentGenres.filter(g => g !== genre);
                          setAggregateArtistActivityFilters((prev) => ({ ...prev, selectedGenres: newGenres }));
                          setPaginationPages((prev) => ({ ...prev, 'artistActivity': 0 }));
                        }}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-xs text-gray-700">{genre}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        )}
        
        <div className="px-5 py-4 space-y-4">
          {filteredArtists.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg px-5 py-8 text-center text-sm text-gray-500">
              {reportData.artistActivity && reportData.artistActivity.length > 0
                ? 'No artists match the selected filters.'
                : 'No artist activity recorded for the selected period.'}
            </div>
          ) : (
            <>
              {pagedArtists.map((artist: any, idx: number) => {
            const fullName = [artist.firstName, artist.lastName].filter(Boolean).join(' ') || 'N/A';
            const locationParts = [artist.city, artist.country]
              .map((part: string | null) => (part ? String(part).trim() : ''))
              .filter((part: string) => Boolean(part) && part.toLowerCase() !== 'n/a');
            const location = locationParts.length > 0 ? locationParts.join(', ') : 'N/A';
            const genresLabel =
              Array.isArray(artist.genres) && artist.genres.length > 0
                ? artist.genres.join(', ')
                : 'N/A';
            const profileImage = artist.profilePicture
              ? getFileUrl(artist.profilePicture)
              : getFileUrl('profile-pictures/default.jpg');
            const verifiedOn =
              artist.verified && artist.dateVerified ? formatDate(artist.dateVerified) : null;

            const followers = Array.isArray(artist.followers) ? artist.followers : [];
            const followerKey = `followers-${artist.artistId ?? artist.username ?? idx}`;
            const followersExpanded = !!expandedFollowerKeys[followerKey];
            const toggleFollowers = () => {
              setExpandedFollowerKeys((prev) => ({
                ...prev,
                [followerKey]: !prev[followerKey]
              }));
            };
            const {
              showSongListens,
              showSongLikes,
              showListenDuration,
              showAlbumLikes
            } = followerColumnToggles;

            const toggleFollowerColumn = (column: keyof typeof followerColumnToggles) => {
              setFollowerColumnToggles((prev) => ({
                ...prev,
                [column]: !prev[column]
              }));
            };

            return (
              <section
                key={`${artist.artistId ?? artist.username ?? idx}`}
                className="report-section bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <div className="bg-gray-100 px-5 py-3.5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-semibold">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt={`${artist.username || 'Artist'} profile`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (artist.username || 'A').slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {artist.username || 'Unknown Artist'}
                        </h3>
                        {artist.verified && (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold shadow">
                            ✓
                </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{fullName}</p>
                      <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Age: {artist.age != null ? formatNumber(artist.age) : 'N/A'}</span>
                        <span>Joined: {formatDate(artist.dateJoined)}</span>
                        <span>Location: {location}</span>
                      </div>
                      {verifiedOn && (
                        <p className="mt-1 text-xs text-blue-600 font-semibold">
                          Verified on {verifiedOn}
                        </p>
                      )}
                      {genresLabel !== 'N/A' && (
                        <p className="mt-1 text-xs text-gray-600">Genres: {genresLabel}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-5 text-sm text-gray-700">
                    <div className="text-center">
                      <p className="font-semibold text-lg text-gray-900">
                        {formatNumber(artist.songsReleased)}
                      </p>
                      <p className="uppercase tracking-wide text-xs text-gray-500">Songs Released</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-lg text-gray-900">
                        {formatNumber(artist.albumsReleased)}
                      </p>
                      <p className="uppercase tracking-wide text-xs text-gray-500">Albums Released</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-lg text-gray-900">
                        {formatNumber(artist.totalListens)}
                      </p>
                      <p className="uppercase tracking-wide text-xs text-gray-500">Total Listens</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-lg text-gray-900">
                        {formatNumber(artist.totalSongLikes)}
                      </p>
                      <p className="uppercase tracking-wide text-xs text-gray-500">Song Likes</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-lg text-gray-900">
                        {formatNumber(artist.totalAlbumLikes)}
                      </p>
                      <p className="uppercase tracking-wide text-xs text-gray-500">Album Likes</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-lg text-gray-900">
                        {formatTime(Number(artist.totalListeningDuration || 0))}
                      </p>
                      <p className="uppercase tracking-wide text-xs text-gray-500 whitespace-nowrap">
                        Total Listen Duration
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Followers {followers.length > 0 && <span className="text-gray-500 font-normal normal-case">({formatNumber(followers.length)})</span>}
                  </h5>
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    {['showSongListens', 'showSongLikes', 'showListenDuration', 'showAlbumLikes'].map((key) =>
                      followers.length > 0 ? (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleFollowerColumn(key as keyof typeof followerColumnToggles)}
                          className={`px-2 py-1 rounded-full border ${
                            followerColumnToggles[key as keyof typeof followerColumnToggles]
                              ? 'border-red-600 text-red-600 bg-red-50'
                              : 'border-gray-300 text-gray-600 bg-white'
                          }`}
                        >
                          {{
                            showSongListens: 'Song Listens',
                            showSongLikes: 'Song Likes',
                            showListenDuration: 'Listen Duration',
                            showAlbumLikes: 'Album Likes'
                          }[key as keyof typeof followerColumnToggles]}
                        </button>
                      ) : null
                    )}
                    {followers.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleFollowers}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        aria-expanded={followersExpanded}
                      >
                        {followersExpanded ? 'Hide followers' : 'Show followers'}
                      </button>
                    )}
                  </div>
                </div>
                  {followers.length === 0 ? (
                    <div className="border border-dashed border-gray-300 rounded-md px-3 py-4 text-center text-sm text-gray-500">
                      No followers recorded during the selected period.
                    </div>
                  ) : followersExpanded ? (
                    <>
                    {(() => {
                      const followerPaginationKey = `artist-${artist.artistId ?? artist.username ?? idx}-followers`;
                      const sortKey = followerPaginationKey;
                      const sortOption = followerSortOptions[sortKey] || 'username-asc';
                      
                      // Sort followers
                      const sortedFollowers = [...followers].sort((a: any, b: any) => {
                        if (sortOption === 'username-asc') {
                          return (a.username || '').toLowerCase().localeCompare((b.username || '').toLowerCase());
                        } else if (sortOption === 'username-desc') {
                          return (b.username || '').toLowerCase().localeCompare((a.username || '').toLowerCase());
                        } else if (sortOption === 'followedAt-asc') {
                          const dateA = a.followedAt ? new Date(a.followedAt).getTime() : 0;
                          const dateB = b.followedAt ? new Date(b.followedAt).getTime() : 0;
                          return dateA - dateB;
                        } else if (sortOption === 'followedAt-desc') {
                          const dateA = a.followedAt ? new Date(a.followedAt).getTime() : 0;
                          const dateB = b.followedAt ? new Date(b.followedAt).getTime() : 0;
                          return dateB - dateA;
                        } else if (sortOption === 'songListens-asc') {
                          const countA = Number(a.songsListenedCount ?? a.listenCount ?? 0);
                          const countB = Number(b.songsListenedCount ?? b.listenCount ?? 0);
                          return countA - countB;
                        } else if (sortOption === 'songListens-desc') {
                          const countA = Number(a.songsListenedCount ?? a.listenCount ?? 0);
                          const countB = Number(b.songsListenedCount ?? b.listenCount ?? 0);
                          return countB - countA;
                        } else if (sortOption === 'songLikes-asc') {
                          const countA = Number(a.songsLikedCount ?? a.likedSongsCount ?? 0);
                          const countB = Number(b.songsLikedCount ?? b.likedSongsCount ?? 0);
                          return countA - countB;
                        } else if (sortOption === 'songLikes-desc') {
                          const countA = Number(a.songsLikedCount ?? a.likedSongsCount ?? 0);
                          const countB = Number(b.songsLikedCount ?? b.likedSongsCount ?? 0);
                          return countB - countA;
                        } else if (sortOption === 'listenDuration-asc') {
                          const durationA = Number(a.totalListeningDuration ?? a.listenDuration ?? 0);
                          const durationB = Number(b.totalListeningDuration ?? b.listenDuration ?? 0);
                          return durationA - durationB;
                        } else if (sortOption === 'listenDuration-desc') {
                          const durationA = Number(a.totalListeningDuration ?? a.listenDuration ?? 0);
                          const durationB = Number(b.totalListeningDuration ?? b.listenDuration ?? 0);
                          return durationB - durationA;
                        } else if (sortOption === 'albumLikes-asc') {
                          const countA = Number(a.albumsLikedCount ?? a.albumLikesCount ?? 0);
                          const countB = Number(b.albumsLikedCount ?? b.albumLikesCount ?? 0);
                          return countA - countB;
                        } else if (sortOption === 'albumLikes-desc') {
                          const countA = Number(a.albumsLikedCount ?? a.albumLikesCount ?? 0);
                          const countB = Number(b.albumsLikedCount ?? b.albumLikesCount ?? 0);
                          return countB - countA;
                        }
                        return 0;
                      });
                      
                      const { items: pagedFollowers, pageInfo: followerPageInfo } = getPaginatedList(
                        sortedFollowers,
                        followerPaginationKey,
                        20
                      );
                      return (
                        <>
                          {/* Sort Dropdown */}
                          <div className="mb-3">
                            <label htmlFor={`follower-sort-${sortKey}`} className="block text-xs font-medium text-gray-600 mb-1">
                              Sort by:
                            </label>
                            <select
                              id={`follower-sort-${sortKey}`}
                              value={sortOption}
                              onChange={(e) => {
                                setFollowerSortOptions((prev) => ({ ...prev, [sortKey]: e.target.value }));
                                setPaginationPages((prev) => ({ ...prev, [followerPaginationKey]: 0 }));
                              }}
                              className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            >
                              <option value="username-asc">Username (A-Z)</option>
                              <option value="username-desc">Username (Z-A)</option>
                              <option value="followedAt-asc">Followed On (Oldest First)</option>
                              <option value="followedAt-desc">Followed On (Newest First)</option>
                              <option value="songListens-asc">Song Listens (Low to High)</option>
                              <option value="songListens-desc">Song Listens (High to Low)</option>
                              <option value="songLikes-asc">Song Likes (Low to High)</option>
                              <option value="songLikes-desc">Song Likes (High to Low)</option>
                              <option value="listenDuration-asc">Listen Duration (Low to High)</option>
                              <option value="listenDuration-desc">Listen Duration (High to Low)</option>
                              <option value="albumLikes-asc">Album Likes (Low to High)</option>
                              <option value="albumLikes-desc">Album Likes (High to Low)</option>
                            </select>
                          </div>
                          
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                              <thead className="bg-white">
                                <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  <th className="px-3.5 py-2.5 text-left">Username</th>
                                  <th className="px-3.5 py-2.5 text-left">Followed On</th>
                                {showSongListens && (
                                  <th className="px-3.5 py-2.5 text-left">Song Listens</th>
                                )}
                                {showSongLikes && (
                                  <th className="px-3.5 py-2.5 text-left">Song Likes</th>
                                )}
                                {showListenDuration && (
                                  <th className="px-3.5 py-2.5 text-left">Listen Duration</th>
                                )}
                                {showAlbumLikes && (
                                  <th className="px-3.5 py-2.5 text-left">Album Likes</th>
                                )}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {pagedFollowers.map((follower: any, followerIdx: number) => (
                            <tr
                              key={`${artist.artistId ?? artist.username ?? idx}-follower-${follower.userId ?? followerIdx}`}
                              className={followerIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                            >
                              <td className="px-3.5 py-2.5 text-sm text-gray-900">{follower.username || 'Unknown'}</td>
                              <td className="px-3.5 py-2.5 text-sm text-gray-900">
                                {formatDateTime(follower.followedAt)}
                              </td>
                              {showSongListens && (
                                <td className="px-3.5 py-2.5 text-sm text-gray-900">
                                  {formatNumber(follower.songsListenedCount ?? follower.listenCount ?? 0)}
                                </td>
                              )}
                              {showSongLikes && (
                                <td className="px-3.5 py-2.5 text-sm text-gray-900">
                                  {formatNumber(follower.songsLikedCount ?? follower.likedSongsCount ?? 0)}
                                </td>
                              )}
                              {showListenDuration && (
                                <td className="px-3.5 py-2.5 text-sm text-gray-900">
                                  {formatTime(follower.totalListeningDuration ?? follower.listenDuration ?? 0)}
                                </td>
                              )}
                              {showAlbumLikes && (
                                <td className="px-3.5 py-2.5 text-sm text-gray-900">
                                  {formatNumber(follower.albumsLikedCount ?? follower.albumLikesCount ?? 0)}
                                </td>
                              )}
                            </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {followers.length > 20 && (
                            <PaginationControls
                              pageInfo={followerPageInfo}
                              onPageChange={(page) => setPageForKey(followerPaginationKey, page, followerPageInfo.pageCount)}
                              className="mt-3"
                            />
                          )}
                        </>
                      );
                    })()}
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Click "Show followers" to reveal this list.
                    </div>
                  )}
                </div>
              </section>
            );
          })}
            </>
          )}
        </div>
        {filteredArtists.length > 0 && (
          <PaginationControls
            pageInfo={artistPageInfo}
            onPageChange={(page) => setPageForKey('artistActivity', page, artistPageInfo.pageCount)}
            className="mt-4"
          />
        )}
      </div>
    );
  };

  const userCreationSparklines = useMemo(() => {
    if (isIndividualUser) return null;

    const reportStartDate = reportMeta.startDate ? new Date(reportMeta.startDate) : null;
    const reportEndDate = reportMeta.endDate ? new Date(reportMeta.endDate) : null;

    if (!reportStartDate || !reportEndDate || isNaN(reportStartDate.getTime()) || isNaN(reportEndDate.getTime())) {
      return null;
    }

    const allUsers: Array<{ dateJoined: string; userType: string }> = [];
    
    if (includeListeners && Array.isArray(reportData.listenerUsers)) {
      reportData.listenerUsers.forEach((user: any) => {
        if (user.dateJoined) {
          allUsers.push({ dateJoined: user.dateJoined, userType: 'Listener' });
        }
      });
    }
    
    if (includeArtists && Array.isArray(reportData.artistUsers)) {
      reportData.artistUsers.forEach((user: any) => {
        if (user.dateJoined) {
          allUsers.push({ dateJoined: user.dateJoined, userType: 'Artist' });
        }
      });
    }

    const dailyCounts: Record<string, { total: number; listeners: number; artists: number }> = {};
    
    // Parse dates as local dates to avoid timezone issues
    const parseLocalDate = (dateStr: string): Date => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
      return new Date(dateStr);
    };
    
    const formatDateKey = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const startDateStr = reportMeta.startDate;
    const endDateStr = reportMeta.endDate;
    
    if (!startDateStr || !endDateStr) {
      return null;
    }
    
    // Start date at 00:00:00
    const start = parseLocalDate(startDateStr);
    start.setHours(0, 0, 0, 0);
    
    // End date at 23:59:59
    const end = parseLocalDate(endDateStr);
    end.setHours(23, 59, 59, 999);
    
    // Ensure we have dates for the exact start and end dates
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = formatDateKey(d);
      dailyCounts[dateKey] = { total: 0, listeners: 0, artists: 0 };
    }

    allUsers.forEach((user) => {
      const userDate = parseLocalDate(user.dateJoined);
      const dateKey = formatDateKey(userDate);
      if (dailyCounts[dateKey]) {
        dailyCounts[dateKey].total++;
        if (user.userType === 'Listener') {
          dailyCounts[dateKey].listeners++;
        } else if (user.userType === 'Artist') {
          dailyCounts[dateKey].artists++;
        }
      }
    });

    // Ensure sortedDates starts with start date and ends with end date
    const startKey = formatDateKey(start);
    const endKey = formatDateKey(end);
    
    // Get all dates from dailyCounts and ensure start and end are included
    const allDates = Object.keys(dailyCounts);
    const dateSet = new Set(allDates);
    dateSet.add(startKey);
    dateSet.add(endKey);
    
    // Sort and ensure start is first and end is last
    const uniqueSortedDates = Array.from(dateSet).sort();
    
    // Ensure first date is start date and last date is end date
    if (uniqueSortedDates[0] !== startKey) {
      uniqueSortedDates.unshift(startKey);
      // Remove duplicate if it exists elsewhere
      const startIndex = uniqueSortedDates.indexOf(startKey, 1);
      if (startIndex > 0) {
        uniqueSortedDates.splice(startIndex, 1);
      }
    }
    if (uniqueSortedDates[uniqueSortedDates.length - 1] !== endKey) {
      uniqueSortedDates.push(endKey);
      // Remove duplicate if it exists elsewhere (search from index 0 to length-2)
      const endIndex = uniqueSortedDates.slice(0, -1).indexOf(endKey);
      if (endIndex >= 0) {
        uniqueSortedDates.splice(endIndex, 1);
      }
    }
    
    // Calculate cumulative totals
    let cumulativeTotal = 0;
    let cumulativeListeners = 0;
    let cumulativeArtists = 0;
    
    const totalData = uniqueSortedDates.map((date) => {
      cumulativeTotal += dailyCounts[date]?.total || 0;
      return cumulativeTotal;
    });
    
    const listenerData = uniqueSortedDates.map((date) => {
      cumulativeListeners += dailyCounts[date]?.listeners || 0;
      return cumulativeListeners;
    });
    
    const artistData = uniqueSortedDates.map((date) => {
      cumulativeArtists += dailyCounts[date]?.artists || 0;
      return cumulativeArtists;
    });

    const totalUsers = totalData[totalData.length - 1] || 0;
    const totalListeners = listenerData[listenerData.length - 1] || 0;
    const totalArtists = artistData[artistData.length - 1] || 0;

    // Remove intermediate points on flat lines, keeping only start and end of flat segments
    // Always preserves first (start date) and last (end date) points
    const removeFlatLinePoints = (dataArray: number[], datesArray: string[]): { data: number[]; dates: string[] } => {
      if (!dataArray || !datesArray || dataArray.length === 0 || datesArray.length === 0) {
        return { data: [], dates: [] };
      }
      
      if (dataArray.length <= 2) {
        return { data: dataArray, dates: datesArray };
      }
      
      const filteredData: number[] = [];
      const filteredDates: string[] = [];
      const lastDate = datesArray[datesArray.length - 1];
      
      // Always include first point (start date)
      filteredData.push(dataArray[0]);
      filteredDates.push(datesArray[0]);
      
      let i = 1;
      while (i < dataArray.length - 1) {
        const currentValue = dataArray[i];
        const flatSegmentStart = i;
        
        // Check if we're starting a flat segment (same value as next point)
        if (i < dataArray.length - 1 && dataArray[i + 1] === currentValue) {
          // Find the end of the flat segment
          while (i < dataArray.length - 1 && dataArray[i + 1] === currentValue) {
            i++;
          }
          // We found a flat segment from flatSegmentStart to i
          // Include the start of the flat segment (only if different from previous)
          if (filteredData.length > 0 && filteredData[filteredData.length - 1] !== currentValue) {
            filteredData.push(dataArray[flatSegmentStart]);
            filteredDates.push(datesArray[flatSegmentStart]);
          }
          // Include the end of the flat segment (if not the last point)
          if (i < dataArray.length - 1) {
            filteredData.push(dataArray[i]);
            filteredDates.push(datesArray[i]);
          }
        } else {
          // Not part of a flat segment, include the point
          filteredData.push(dataArray[i]);
          filteredDates.push(datesArray[i]);
        }
        i++;
      }
      
      // Always include last point (end date) if not already included
      if (filteredDates.length === 0 || filteredDates[filteredDates.length - 1] !== lastDate) {
        filteredData.push(dataArray[dataArray.length - 1]);
        filteredDates.push(datesArray[datesArray.length - 1]);
      }
      
      return { data: filteredData, dates: filteredDates };
    };

    // Sample data to 15-20 points for better performance and visual clarity
    // Always includes first (start date) and last (end date) points
    const sampleData = <T,>(dataArray: T[], datesArray: string[], targetPoints: number = 18): { data: T[]; dates: string[] } => {
      if (!dataArray || !datesArray || dataArray.length === 0 || datesArray.length === 0) {
        return { data: [], dates: [] };
      }
      
      if (dataArray.length <= targetPoints) {
        return { data: dataArray, dates: datesArray };
      }
      
      const sampledData: T[] = [];
      const sampledDates: string[] = [];
      
      // Always include first point (start date)
      sampledData.push(dataArray[0]);
      sampledDates.push(datesArray[0]);
      
      // Sample middle points
      const step = (dataArray.length - 1) / (targetPoints - 1);
      for (let i = 1; i < targetPoints - 1; i++) {
        const index = Math.min(Math.round(i * step), dataArray.length - 1);
        if (dataArray[index] !== undefined && datesArray[index]) {
          sampledData.push(dataArray[index]);
          sampledDates.push(datesArray[index]);
        }
      }
      
      // Always include last point (end date)
      if (sampledDates.length > 0 && sampledDates[sampledDates.length - 1] !== datesArray[datesArray.length - 1]) {
        sampledData.push(dataArray[dataArray.length - 1]);
        sampledDates.push(datesArray[datesArray.length - 1]);
      } else if (sampledDates.length === 0 || sampledDates[sampledDates.length - 1] !== datesArray[datesArray.length - 1]) {
        sampledData.push(dataArray[dataArray.length - 1]);
        sampledDates.push(datesArray[datesArray.length - 1]);
      }
      
      return { data: sampledData, dates: sampledDates };
    };

    const sampledTotal = sampleData(totalData, uniqueSortedDates);
    const sampledListeners = sampleData(listenerData, uniqueSortedDates);
    const sampledArtists = sampleData(artistData, uniqueSortedDates);

    // Remove flat line points from sampled data
    const filteredTotal = removeFlatLinePoints(sampledTotal.data as number[], sampledTotal.dates);
    const filteredListeners = removeFlatLinePoints(sampledListeners.data as number[], sampledListeners.dates);
    const filteredArtists = removeFlatLinePoints(sampledArtists.data as number[], sampledArtists.dates);

    // Create a unified dates array that includes all dates from any filtered dataset
    // Since all datasets start with the same dates, we'll take the union of all filtered dates
    const allDatesSet = new Set<string>();
    filteredTotal.dates.forEach(date => allDatesSet.add(date));
    filteredListeners.dates.forEach(date => allDatesSet.add(date));
    filteredArtists.dates.forEach(date => allDatesSet.add(date));
    
    // Ensure start and end dates are always included
    allDatesSet.add(startKey);
    allDatesSet.add(endKey);
    
    // Convert to sorted array (dates should already be sorted, but ensure it)
    const unifiedDates = Array.from(allDatesSet).sort();
    
    // Ensure first date is start date and last date is end date
    if (unifiedDates[0] !== startKey) {
      unifiedDates.unshift(startKey);
      const startIndex = unifiedDates.indexOf(startKey, 1);
      if (startIndex > 0) {
        unifiedDates.splice(startIndex, 1);
      }
    }
    if (unifiedDates[unifiedDates.length - 1] !== endKey) {
      unifiedDates.push(endKey);
      // Remove duplicate if it exists elsewhere (search from index 0 to length-2)
      const endIndex = unifiedDates.slice(0, -1).indexOf(endKey);
      if (endIndex >= 0) {
        unifiedDates.splice(endIndex, 1);
      }
    }
    
    // Create maps for quick lookup of values by date
    const createDataMap = (filtered: { data: number[]; dates: string[] }) => {
      const map = new Map<string, number>();
      filtered.dates.forEach((date, idx) => {
        map.set(date, filtered.data[idx]);
      });
      return map;
    };
    
    const totalMap = createDataMap(filteredTotal);
    const listenersMap = createDataMap(filteredListeners);
    const artistsMap = createDataMap(filteredArtists);
    
    // Align all data arrays to the unified dates
    // For missing dates, use the last known value (since these are cumulative)
    // Ensure first point (start date) has correct initial value and last point (end date) has final value
    const alignedTotalData: number[] = [];
    const alignedListenersData: number[] = [];
    const alignedArtistsData: number[] = [];
    
    let lastTotal = 0;
    let lastListeners = 0;
    let lastArtists = 0;
    
    unifiedDates.forEach((date, index) => {
      // For the first date (start date), ensure we start with 0 or the actual value if it exists
      if (index === 0 && totalMap.has(date)) {
        lastTotal = totalMap.get(date)!;
      } else if (totalMap.has(date)) {
        lastTotal = totalMap.get(date)!;
      }
      alignedTotalData.push(lastTotal);
      
      if (index === 0 && listenersMap.has(date)) {
        lastListeners = listenersMap.get(date)!;
      } else if (listenersMap.has(date)) {
        lastListeners = listenersMap.get(date)!;
      }
      alignedListenersData.push(lastListeners);
      
      if (index === 0 && artistsMap.has(date)) {
        lastArtists = artistsMap.get(date)!;
      } else if (artistsMap.has(date)) {
        lastArtists = artistsMap.get(date)!;
      }
      alignedArtistsData.push(lastArtists);
    });
    
    // Ensure the last point (end date) has the final cumulative values
    if (unifiedDates.length > 0 && unifiedDates[unifiedDates.length - 1] === endKey) {
      const lastIndex = unifiedDates.length - 1;
      alignedTotalData[lastIndex] = totalUsers;
      alignedListenersData[lastIndex] = totalListeners;
      alignedArtistsData[lastIndex] = totalArtists;
    }

    return {
      total: { data: alignedTotalData, total: totalUsers },
      listeners: { data: alignedListenersData, total: totalListeners },
      artists: { data: alignedArtistsData, total: totalArtists },
      dateRange: { start: start, end: end },
      dates: unifiedDates
    };
  }, [
    isIndividualUser,
    includeListeners,
    includeArtists,
    reportData.listenerUsers,
    reportData.artistUsers,
    reportMeta.startDate,
    reportMeta.endDate
  ]);

  useEffect(() => {
    if (userCreationSparklines) {
      setExpandedSparklines({
        total: true,
        listeners: true,
        artists: true
      });
    }
  }, [userCreationSparklines]);

  const songActivitySparklines = useMemo(() => {
    if (isIndividualUser || !showSongStats) return null;

    // Parse dates and set start to 00:00:00 and end to 23:59:59
    const parseLocalDate = (dateStr: string): Date => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
      return new Date(dateStr);
    };
    
    const startDateStr = reportMeta.startDate;
    const endDateStr = reportMeta.endDate;
    
    if (!startDateStr || !endDateStr) {
      return null;
    }
    
    // Start date at 00:00:00
    const reportStartDate = parseLocalDate(startDateStr);
    reportStartDate.setHours(0, 0, 0, 0);
    
    // End date at 23:59:59
    const reportEndDate = parseLocalDate(endDateStr);
    reportEndDate.setHours(23, 59, 59, 999);

    if (isNaN(reportStartDate.getTime()) || isNaN(reportEndDate.getTime())) {
      return null;
    }

    const songsUploaded: Array<{ releaseDate: string }> = [];

    // Collect songs uploaded data
    if (Array.isArray(reportData.songActivity)) {
      reportData.songActivity.forEach((song: any) => {
        if (song.releaseDate) {
          songsUploaded.push({ releaseDate: song.releaseDate });
        }
      });
    }

    const dailyUploads: Record<string, number> = {};
    const dailyPlays: Record<string, number> = {};

    const formatDateKey = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const start = new Date(reportStartDate);
    const end = new Date(reportEndDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = formatDateKey(d);
      dailyUploads[dateKey] = 0;
      dailyPlays[dateKey] = 0;
    }

    songsUploaded.forEach((song) => {
      const songDate = parseLocalDate(song.releaseDate);
      const dateKey = formatDateKey(songDate);
      if (dailyUploads[dateKey] !== undefined) {
        dailyUploads[dateKey]++;
      }
    });

    // For songs played, use actual daily listening counts from the database
    // This counts total listens, not unique songs
    const dailyListeningCounts = Array.isArray(reportData.dailyListeningCounts) 
      ? reportData.dailyListeningCounts 
      : [];

    dailyListeningCounts.forEach((entry: any) => {
      const dateKey = entry.date;
      if (dateKey && dailyPlays[dateKey] !== undefined) {
        dailyPlays[dateKey] += Number(entry.count || 0);
      }
    });

    const startKey = formatDateKey(start);
    const endKey = formatDateKey(end);
    
    // Get all dates and ensure start and end are included
    const allPlayDates = Object.keys(dailyPlays);
    const allUploadDates = Object.keys(dailyUploads);
    const allDatesSet = new Set([...allPlayDates, ...allUploadDates, startKey, endKey]);
    
    let sortedDates = Array.from(allDatesSet).sort();
    let sortedUploadDates = Array.from(allDatesSet).sort();
    
    // Ensure first date is start date and last date is end date
    if (sortedDates[0] !== startKey) {
      sortedDates.unshift(startKey);
      const startIndex = sortedDates.indexOf(startKey, 1);
      if (startIndex > 0) {
        sortedDates.splice(startIndex, 1);
      }
    }
    if (sortedDates[sortedDates.length - 1] !== endKey) {
      sortedDates.push(endKey);
      const endIndex = sortedDates.slice(0, -1).indexOf(endKey);
      if (endIndex >= 0) {
        sortedDates.splice(endIndex, 1);
      }
    }
    
    if (sortedUploadDates[0] !== startKey) {
      sortedUploadDates.unshift(startKey);
      const startIndex = sortedUploadDates.indexOf(startKey, 1);
      if (startIndex > 0) {
        sortedUploadDates.splice(startIndex, 1);
      }
    }
    if (sortedUploadDates[sortedUploadDates.length - 1] !== endKey) {
      sortedUploadDates.push(endKey);
      const endIndex = sortedUploadDates.slice(0, -1).indexOf(endKey);
      if (endIndex >= 0) {
        sortedUploadDates.splice(endIndex, 1);
      }
    }
    
    // Calculate cumulative plays
    let cumulativePlays = 0;
    sortedDates.forEach((date) => {
      cumulativePlays += dailyPlays[date] || 0;
      dailyPlays[date] = cumulativePlays;
    });

    // Calculate cumulative totals
    let cumulativeUploads = 0;
    const uploadData = sortedUploadDates.map((date) => {
      cumulativeUploads += dailyUploads[date] || 0;
      return cumulativeUploads;
    });

    const playData = sortedDates.map((date) => dailyPlays[date] || 0);

    const totalUploads = uploadData[uploadData.length - 1] || 0;
    const totalPlays = playData[playData.length - 1] || 0;

    // Use the same helper functions from userCreationSparklines
    // Remove intermediate points on flat lines, keeping only start and end of flat segments
    // Always preserves first (start date) and last (end date) points
    const removeFlatLinePoints = (dataArray: number[], datesArray: string[]): { data: number[]; dates: string[] } => {
      if (!dataArray || !datesArray || dataArray.length === 0 || datesArray.length === 0) {
        return { data: [], dates: [] };
      }
      
      if (dataArray.length <= 2) {
        return { data: dataArray, dates: datesArray };
      }
      
      const filteredData: number[] = [];
      const filteredDates: string[] = [];
      const lastDate = datesArray[datesArray.length - 1];
      
      // Always include first point (start date)
      filteredData.push(dataArray[0]);
      filteredDates.push(datesArray[0]);
      
      let i = 1;
      while (i < dataArray.length - 1) {
        const currentValue = dataArray[i];
        const flatSegmentStart = i;
        
        // Check if we're starting a flat segment (same value as next point)
        if (i < dataArray.length - 1 && dataArray[i + 1] === currentValue) {
          // Find the end of the flat segment
          while (i < dataArray.length - 1 && dataArray[i + 1] === currentValue) {
            i++;
          }
          // We found a flat segment from flatSegmentStart to i
          // Include the start of the flat segment (only if different from previous)
          if (filteredData.length > 0 && filteredData[filteredData.length - 1] !== currentValue) {
            filteredData.push(dataArray[flatSegmentStart]);
            filteredDates.push(datesArray[flatSegmentStart]);
          }
          // Include the end of the flat segment (if not the last point)
          if (i < dataArray.length - 1) {
            filteredData.push(dataArray[i]);
            filteredDates.push(datesArray[i]);
          }
        } else {
          // Not part of a flat segment, include the point
          filteredData.push(dataArray[i]);
          filteredDates.push(datesArray[i]);
        }
        i++;
      }
      
      // Always include last point (end date) if not already included
      if (filteredDates.length === 0 || filteredDates[filteredDates.length - 1] !== lastDate) {
        filteredData.push(dataArray[dataArray.length - 1]);
        filteredDates.push(datesArray[datesArray.length - 1]);
      }
      
      return { data: filteredData, dates: filteredDates };
    };

    // Sample data to 15-20 points for better performance and visual clarity
    // Always includes first (start date) and last (end date) points
    const sampleData = <T,>(dataArray: T[], datesArray: string[], targetPoints: number = 18): { data: T[]; dates: string[] } => {
      if (!dataArray || !datesArray || dataArray.length === 0 || datesArray.length === 0) {
        return { data: [], dates: [] };
      }
      
      if (dataArray.length <= targetPoints) {
        return { data: dataArray, dates: datesArray };
      }
      
      const sampledData: T[] = [];
      const sampledDates: string[] = [];
      
      // Always include first point (start date)
      sampledData.push(dataArray[0]);
      sampledDates.push(datesArray[0]);
      
      // Sample middle points
      const step = (dataArray.length - 1) / (targetPoints - 1);
      for (let i = 1; i < targetPoints - 1; i++) {
        const index = Math.min(Math.round(i * step), dataArray.length - 1);
        if (dataArray[index] !== undefined && datesArray[index]) {
          sampledData.push(dataArray[index]);
          sampledDates.push(datesArray[index]);
        }
      }
      
      // Always include last point (end date)
      if (sampledDates.length > 0 && sampledDates[sampledDates.length - 1] !== datesArray[datesArray.length - 1]) {
        sampledData.push(dataArray[dataArray.length - 1]);
        sampledDates.push(datesArray[datesArray.length - 1]);
      } else if (sampledDates.length === 0 || sampledDates[sampledDates.length - 1] !== datesArray[datesArray.length - 1]) {
        sampledData.push(dataArray[dataArray.length - 1]);
        sampledDates.push(datesArray[datesArray.length - 1]);
      }
      
      return { data: sampledData, dates: sampledDates };
    };

    const sampledUploads = sampleData(uploadData, sortedUploadDates);
    const sampledPlays = sampleData(playData, sortedDates);

    const filteredUploads = removeFlatLinePoints(sampledUploads.data as number[], sampledUploads.dates);
    const filteredPlays = removeFlatLinePoints(sampledPlays.data as number[], sampledPlays.dates);

    const unifiedDatesSet = new Set<string>();
    filteredUploads.dates.forEach(date => unifiedDatesSet.add(date));
    filteredPlays.dates.forEach(date => unifiedDatesSet.add(date));
    
    // Ensure start and end dates are always included
    unifiedDatesSet.add(startKey);
    unifiedDatesSet.add(endKey);
    
    const unifiedDates = Array.from(unifiedDatesSet).sort();
    
    // Ensure first date is start date and last date is end date
    if (unifiedDates[0] !== startKey) {
      unifiedDates.unshift(startKey);
      const startIndex = unifiedDates.indexOf(startKey, 1);
      if (startIndex > 0) {
        unifiedDates.splice(startIndex, 1);
      }
    }
    if (unifiedDates[unifiedDates.length - 1] !== endKey) {
      unifiedDates.push(endKey);
      const endIndex = unifiedDates.slice(0, -1).indexOf(endKey);
      if (endIndex >= 0) {
        unifiedDates.splice(endIndex, 1);
      }
    }
    
    const createDataMap = (filtered: { data: number[]; dates: string[] }) => {
      const map = new Map<string, number>();
      filtered.dates.forEach((date, idx) => {
        map.set(date, filtered.data[idx]);
      });
      return map;
    };
    
    const uploadsMap = createDataMap(filteredUploads);
    const playsMap = createDataMap(filteredPlays);
    
    const alignedUploadsData: number[] = [];
    const alignedPlaysData: number[] = [];
    
    let lastUploads = 0;
    let lastPlays = 0;
    
    unifiedDates.forEach((date, index) => {
      // For the first date (start date), ensure we start with 0 or the actual value if it exists
      if (index === 0 && uploadsMap.has(date)) {
        lastUploads = uploadsMap.get(date)!;
      } else if (uploadsMap.has(date)) {
        lastUploads = uploadsMap.get(date)!;
      }
      alignedUploadsData.push(lastUploads);
      
      if (index === 0 && playsMap.has(date)) {
        lastPlays = playsMap.get(date)!;
      } else if (playsMap.has(date)) {
        lastPlays = playsMap.get(date)!;
      }
      alignedPlaysData.push(lastPlays);
    });
    
    // Ensure the last point (end date) has the final cumulative values
    if (unifiedDates.length > 0 && unifiedDates[unifiedDates.length - 1] === endKey) {
      const lastIndex = unifiedDates.length - 1;
      alignedUploadsData[lastIndex] = totalUploads;
      alignedPlaysData[lastIndex] = totalPlays;
    }

    return {
      uploaded: { data: alignedUploadsData, total: totalUploads },
      played: { data: alignedPlaysData, total: totalPlays },
      dateRange: { start: start, end: end },
      dates: unifiedDates
    };
  }, [
    isIndividualUser,
    showSongStats,
    reportData.songActivity,
    reportData.dailyListeningCounts,
    reportMeta.startDate,
    reportMeta.endDate
  ]);

  const [expandedSongSparklines, setExpandedSongSparklines] = useState<{ uploaded: boolean; played: boolean }>({
    uploaded: true,
    played: true
  });

  useEffect(() => {
    if (songActivitySparklines) {
      setExpandedSongSparklines({
        uploaded: true,
        played: true
      });
    }
  }, [songActivitySparklines]);

  const SparklineGraph: React.FC<{
    data: number[];
    label: string;
    total: number;
    dateRange: { start: Date; end: Date };
    dates: string[];
  }> = ({ data, label, dateRange, dates }) => {
    if (!data || data.length === 0 || !dates || dates.length === 0) return null;

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const maxValue = Math.max(...data, 1);
    const minValue = Math.min(...data, 0);
    const valueRange = maxValue - minValue;
    const width = 900;
    const height = 220;
    const paddingTop = 20;
    const paddingBottom = 35;
    const paddingLeft = 50;
    const paddingRight = 20;
    const graphWidth = width - paddingLeft - paddingRight;
    const graphHeight = height - paddingTop - paddingBottom;

    const dataPoints = data.map((value, index) => {
      const x = paddingLeft + (index / (data.length - 1 || 1)) * graphWidth;
      const y = paddingTop + graphHeight - ((value - minValue) / (valueRange || 1)) * graphHeight;
      return { x, y, value, date: dates[index] || '' };
    });

    const points = dataPoints.map((point) => `${point.x},${point.y}`).join(' ');

    const handlePointHover = (index: number) => {
      setHoveredIndex(index);
    };

    const handlePointLeave = () => {
      setHoveredIndex(null);
    };

    const formatDateLabel = (dateStr: string) => {
      const date = new Date(dateStr);
      const daysDiff = Math.floor((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 7) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (daysDiff <= 31) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (daysDiff <= 365) {
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
    };

    const formatYAxisLabel = (value: number) => {
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}k`;
      }
      return value.toString();
    };

    const yAxisTicks = [];
    const numTicks = 5;
    for (let i = 0; i <= numTicks; i++) {
      const value = minValue + (valueRange * i) / numTicks;
      yAxisTicks.push(value);
    }

    // Calculate X-axis date labels - always show 9 dates evenly spaced along the time axis
    const getXAxisDates = () => {
      if (!dates || dates.length === 0 || !dateRange.start || !dateRange.end) return [];
      
      const numLabels = 9;
      const xAxisDates: Array<{ date: Date; xPosition: number }> = [];
      
      const startTime = dateRange.start.getTime();
      const endTime = dateRange.end.getTime();
      
      if (isNaN(startTime) || isNaN(endTime)) return [];
      
      const timeRange = endTime - startTime;
      
      // Calculate evenly spaced dates along the time range
      for (let i = 0; i < numLabels; i++) {
        const timeOffset = (timeRange * i) / (numLabels - 1);
        const date = new Date(startTime + timeOffset);
        
        // Calculate X position based on the date's position in the time range
        const xPosition = paddingLeft + (i / (numLabels - 1)) * graphWidth;
        
        xAxisDates.push({ date, xPosition });
      }
      
      return xAxisDates;
    };

    const xAxisDates = getXAxisDates();

    const formatTooltipDate = (dateStr: string) => {
      if (!dateStr) return 'N/A';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const hoveredPoint = hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < dataPoints.length 
      ? dataPoints[hoveredIndex] 
      : null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 relative">
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-gray-800">{label}</h4>
        </div>
        <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          {/* Y-axis labels */}
          {yAxisTicks.map((value, idx) => {
            const y = paddingTop + graphHeight - ((value - minValue) / (valueRange || 1)) * graphHeight;
            if (isNaN(y) || isNaN(value)) return null;
            return (
              <g key={`y-tick-${idx}`}>
                <line
                  x1={paddingLeft - 5}
                  y1={y}
                  x2={paddingLeft}
                  y2={y}
                  stroke="#9ca3af"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#6b7280"
                  className="font-medium"
                >
                  {formatYAxisLabel(Math.round(value))}
                </text>
              </g>
            );
          })}
          
          {/* X-axis labels with multiple dates */}
          {xAxisDates.map(({ date, xPosition }, idx) => {
            if (!date || isNaN(date.getTime()) || isNaN(xPosition)) return null;
            const dateStr = date.toISOString().split('T')[0];
            return (
              <g key={`x-label-${idx}-${dateStr}`}>
                <line
                  x1={xPosition}
                  y1={height - paddingBottom}
                  x2={xPosition}
                  y2={height - paddingBottom + 5}
                  stroke="#9ca3af"
                  strokeWidth="1"
                />
                <text
                  x={xPosition}
                  y={height - paddingBottom + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6b7280"
                  className="font-medium"
                >
                  {formatDateLabel(dateStr)}
                </text>
              </g>
            );
          })}
          
          {/* Grid lines */}
          {yAxisTicks.map((value, idx) => {
            const y = paddingTop + graphHeight - ((value - minValue) / (valueRange || 1)) * graphHeight;
            if (isNaN(y) || isNaN(value)) return null;
            return (
              <line
                key={`grid-${idx}`}
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            );
          })}
          
          {/* Graph line */}
          <polyline
            fill="none"
            stroke="#dc2626"
            strokeWidth="2.5"
            points={points}
            vectorEffect="non-scaling-stroke"
          />
          
          {/* Data points */}
          {dataPoints.map((point, index) => (
            <circle
              key={`point-${index}`}
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === index ? 6 : 4}
              fill={hoveredIndex === index ? "#dc2626" : "#dc2626"}
              stroke="#ffffff"
              strokeWidth={hoveredIndex === index ? 2 : 1.5}
              onMouseEnter={() => handlePointHover(index)}
              onMouseLeave={handlePointLeave}
              style={{ cursor: 'pointer' }}
            />
          ))}
          
          {/* Axes */}
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={height - paddingBottom}
            stroke="#9ca3af"
            strokeWidth="1.5"
          />
          <line
            x1={paddingLeft}
            y1={height - paddingBottom}
            x2={width - paddingRight}
            y2={height - paddingBottom}
            stroke="#9ca3af"
            strokeWidth="1.5"
          />
        </svg>
        
        {/* Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute bg-blue-600 text-white text-xs rounded-lg shadow-lg p-2 z-10 pointer-events-none whitespace-nowrap"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${Math.max(0, ((hoveredPoint.y - 70) / height) * 100)}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-semibold mb-1">
              {formatTooltipDate(hoveredPoint.date)}
            </div>
            <div>
              {label.includes('User') ? 'Users' : label.includes('Songs Played') ? 'Listens' : label.includes('Song') ? 'Songs' : 'Count'}: {formatNumber(hoveredPoint.value)}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSummaryView = () => {
    if (isIndividualUser) {
      return renderIndividualUserReport();
    }

    const toggleSummaryChart = (chart: 'country' | 'age') => {
      setExpandedSummaryCharts((prev) => ({
        ...prev,
        [chart]: !prev[chart]
      }));
    };
    const countryExpanded = expandedSummaryCharts.country;
    const ageExpanded = expandedSummaryCharts.age;

    return (
      <div className="space-y-4">
        <div className="report-cover bg-white border border-gray-200 rounded-lg px-5 py-4 text-center shadow-sm print:shadow-none print:border-0">
          <h2 className="mt-1 text-2xl font-bold text-gray-900">CoogMusic Analytics Summary</h2>
          {reportingRange && (
            <p className="mt-1 text-gray-600 text-sm">Reporting Period: {reportingRange}</p>
          )}
          {generatedAt && (
            <p className="mt-1 text-xs text-gray-500">Generated {generatedAt}</p>
          )}
        </div>
        {summarySections.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-lg px-5 py-10 text-center text-gray-500">
            No summary metrics are available for the current filters.
          </div>
        ) : (
          summarySections.map((section, idx) => (
            <React.Fragment key={`${section.title}-${idx}`}>
              <SummarySection
                title={section.title}
                rows={section.rows}
              />
              {section.title === 'Song Activity' && songActivitySparklines && (
                <section className="report-section print-keep-together bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-800 uppercase tracking-wider">Song Activity Over Time</h3>
                      <p className="text-xs text-gray-600 mt-1">Cumulative song activity trends during the reporting period</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {songActivitySparklines.uploaded && (
                        <button
                          type="button"
                          onClick={() => setExpandedSongSparklines((prev) => ({ ...prev, uploaded: !prev.uploaded }))}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          aria-expanded={expandedSongSparklines.uploaded}
                        >
                          {expandedSongSparklines.uploaded ? 'Hide Songs Uploaded' : 'Show Songs Uploaded'}
                        </button>
                      )}
                      {songActivitySparklines.played && (
                        <button
                          type="button"
                          onClick={() => setExpandedSongSparklines((prev) => ({ ...prev, played: !prev.played }))}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          aria-expanded={expandedSongSparklines.played}
                        >
                          {expandedSongSparklines.played ? 'Hide Songs Played' : 'Show Songs Played'}
                        </button>
                      )}
                    </div>
                  </div>
                  {(expandedSongSparklines.uploaded || expandedSongSparklines.played) && songActivitySparklines ? (
                    <div className="px-4 py-4 space-y-4">
                      {songActivitySparklines.uploaded && songActivitySparklines.uploaded.data && songActivitySparklines.uploaded.data.length > 0 && expandedSongSparklines.uploaded && songActivitySparklines.dates && songActivitySparklines.dates.length > 0 && (
                        <SparklineGraph
                          data={songActivitySparklines.uploaded.data}
                          label="Songs Uploaded"
                          total={songActivitySparklines.uploaded.total}
                          dateRange={songActivitySparklines.dateRange}
                          dates={songActivitySparklines.dates}
                        />
                      )}
                      {songActivitySparklines.played && songActivitySparklines.played.data && songActivitySparklines.played.data.length > 0 && expandedSongSparklines.played && songActivitySparklines.dates && songActivitySparklines.dates.length > 0 && (
                        <SparklineGraph
                          data={songActivitySparklines.played.data}
                          label="Songs Played"
                          total={songActivitySparklines.played.total}
                          dateRange={songActivitySparklines.dateRange}
                          dates={songActivitySparklines.dates}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      Click "Show" buttons above to display song activity trends.
                    </div>
                  )}
                </section>
              )}
              {section.title === 'User Creation' && userCreationSparklines && (
                <section className="report-section print-keep-together bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-800 uppercase tracking-wider">User Creation Over Time</h3>
                      <p className="text-xs text-gray-600 mt-1">Daily account creation trends during the reporting period</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {userCreationSparklines.total && (
                        <button
                          type="button"
                          onClick={() => setExpandedSparklines((prev) => ({ ...prev, total: !prev.total }))}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          aria-expanded={expandedSparklines.total}
                        >
                          {expandedSparklines.total ? 'Hide Total Users' : 'Show Total Users'}
                        </button>
                      )}
                      {includeListeners && userCreationSparklines.listeners && (
                        <button
                          type="button"
                          onClick={() => setExpandedSparklines((prev) => ({ ...prev, listeners: !prev.listeners }))}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          aria-expanded={expandedSparklines.listeners}
                        >
                          {expandedSparklines.listeners ? 'Hide Listeners' : 'Show Listeners'}
                        </button>
                      )}
                      {includeArtists && userCreationSparklines.artists && (
                        <button
                          type="button"
                          onClick={() => setExpandedSparklines((prev) => ({ ...prev, artists: !prev.artists }))}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          aria-expanded={expandedSparklines.artists}
                        >
                          {expandedSparklines.artists ? 'Hide Artists' : 'Show Artists'}
                        </button>
                      )}
                    </div>
                  </div>
                  {(expandedSparklines.total || expandedSparklines.listeners || expandedSparklines.artists) && userCreationSparklines ? (
                    <div className="px-4 py-4 space-y-4">
                      {userCreationSparklines.total && userCreationSparklines.total.data && userCreationSparklines.total.data.length > 0 && expandedSparklines.total && userCreationSparklines.dates && userCreationSparklines.dates.length > 0 && (
                        <SparklineGraph
                          data={userCreationSparklines.total.data}
                          label="Total Users"
                          total={userCreationSparklines.total.total}
                          dateRange={userCreationSparklines.dateRange}
                          dates={userCreationSparklines.dates}
                        />
                      )}
                      {includeListeners && userCreationSparklines.listeners && userCreationSparklines.listeners.data && userCreationSparklines.listeners.data.length > 0 && expandedSparklines.listeners && userCreationSparklines.dates && userCreationSparklines.dates.length > 0 && (
                        <SparklineGraph
                          data={userCreationSparklines.listeners.data}
                          label="Listeners"
                          total={userCreationSparklines.listeners.total}
                          dateRange={userCreationSparklines.dateRange}
                          dates={userCreationSparklines.dates}
                        />
                      )}
                      {includeArtists && userCreationSparklines.artists && userCreationSparklines.artists.data && userCreationSparklines.artists.data.length > 0 && expandedSparklines.artists && userCreationSparklines.dates && userCreationSparklines.dates.length > 0 && (
                        <SparklineGraph
                          data={userCreationSparklines.artists.data}
                          label="Artists"
                          total={userCreationSparklines.artists.total}
                          dateRange={userCreationSparklines.dateRange}
                          dates={userCreationSparklines.dates}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      Click "Show" buttons above to display user creation trends.
                    </div>
                  )}
                </section>
              )}
            </React.Fragment>
          ))
        )}
        {countryChartData && (
          <section className="report-section print-keep-together bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-800 uppercase tracking-wider">Country Distribution</h3>
                <p className="text-xs text-gray-600">Top countries by included users</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-gray-500">{countryChartData.rows.length} countries</span>
                <button
                  type="button"
                  onClick={() => toggleSummaryChart('country')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  aria-expanded={countryExpanded}
                >
                  {countryExpanded ? 'Hide chart' : 'Show chart'}
                </button>
              </div>
            </div>
            {countryExpanded ? (
              <div className="px-4 py-3 space-y-2">
                {countryChartData.rows.map((row) => (
                  <div key={row.country} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-700 w-28">{row.country}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-600 rounded-full transition-all duration-200"
                        style={{
                          width:
                            countryChartData.maxCount > 0
                              ? `${(row.count / countryChartData.maxCount) * 100}%`
                              : '0%'
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-32 text-right">{`${row.count.toLocaleString()} (${row.ratio ?? '0%'})`}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500">
                Click “Show chart” to display country distribution.
              </div>
            )}
          </section>
        )}
        {ageHistogramData && (
          <section className="report-section print-keep-together bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-800 uppercase tracking-wider">Age Demographics</h3>
                <p className="text-xs text-gray-600">Distribution of listeners across ages</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleSummaryChart('age')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  aria-expanded={ageExpanded}
                >
                  {ageExpanded ? 'Hide chart' : 'Show chart'}
                </button>
              </div>
            </div>
            {ageExpanded ? (
              <div className="px-4 py-3 space-y-2">
                {ageHistogramData.rows.map((row) => (
                  <div key={row.range} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-700 w-28">{row.range}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full transition-all duration-200"
                        style={{
                          width:
                            ageHistogramData.maxCount > 0
                              ? `${(row.count / ageHistogramData.maxCount) * 100}%`
                              : '0%'
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-32 text-right">{`${row.count.toLocaleString()} (${row.ratio ?? '0%'})`}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500">
                Click “Show chart” to display age demographics.
              </div>
            )}
          </section>
        )}
      </div>
    );
  };

  const isDateWithinRange = (
    value: string | null | undefined,
    range: { start?: string; end?: string }
  ) => {
    const parsed = value ? new Date(value) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) {
      return false;
    }
    if (range.start) {
      const start = new Date(range.start);
      if (!Number.isNaN(start.getTime()) && parsed < start) {
        return false;
      }
    }
    if (range.end) {
      const end = new Date(range.end);
      if (!Number.isNaN(end.getTime()) && parsed > end) {
        return false;
      }
    }
    return true;
  };

  const renderUserActivityView = () => {
    const { showEmail, showCountry, showCity } = userActivityColumns;
    const toggleColumn = (column: 'email' | 'country' | 'city') => {
      setUserActivityColumns((prev) => ({
        ...prev,
        showEmail: column === 'email' ? !prev.showEmail : prev.showEmail,
        showCountry: column === 'country' ? !prev.showCountry : prev.showCountry,
        showCity: column === 'city' ? !prev.showCity : prev.showCity
      }));
    };
    // Extract unique countries for listeners
    const listenerCountries = Array.from(
      new Set(
        (reportData.listenerUsers ?? [])
          .map((user: any) => user.country)
          .filter((country: any) => country)
      )
    ).sort() as string[];
    
    // Extract cities for listeners based on selected country
    const listenerCities = Array.from(
      new Set(
        (reportData.listenerUsers ?? [])
          .filter((user: any) => 
            listenerCountryFilter === 'All Countries' || user.country === listenerCountryFilter
          )
          .map((user: any) => user.city)
          .filter((city: any) => city)
      )
    ).sort() as string[];

    // Extract unique countries for artists
    const artistCountries = Array.from(
      new Set(
        (reportData.artistUsers ?? [])
          .map((user: any) => user.country)
          .filter((country: any) => country)
      )
    ).sort() as string[];
    
    // Extract cities for artists based on selected country
    const artistCities = Array.from(
      new Set(
        (reportData.artistUsers ?? [])
          .filter((user: any) => 
            artistCountryFilter === 'All Countries' || user.country === artistCountryFilter
          )
          .map((user: any) => user.city)
          .filter((city: any) => city)
      )
    ).sort() as string[];

    const filteredListeners = (reportData.listenerUsers ?? []).filter((user: any) => {
      // Date of birth filter
      if (listenerDobRange.start || listenerDobRange.end) {
        if (!isDateWithinRange(user.dateOfBirth, listenerDobRange)) {
          return false;
        }
      }
      // Country filter
      if (listenerCountryFilter !== 'All Countries' && user.country !== listenerCountryFilter) {
        return false;
      }
      // City filter
      if (listenerCityFilter !== 'All Cities' && user.city !== listenerCityFilter) {
        return false;
      }
      // Songs Played Under filter
      if (userActivityFilters.songsPlayedUnder) {
        const threshold = Number(userActivityFilters.songsPlayedUnder);
        if (!Number.isNaN(threshold) && Number(user.totalSongsPlayed || 0) >= threshold) {
          return false;
        }
      }
      // Songs Played Over filter
      if (userActivityFilters.songsPlayedOver) {
        const threshold = Number(userActivityFilters.songsPlayedOver);
        if (!Number.isNaN(threshold) && Number(user.totalSongsPlayed || 0) <= threshold) {
          return false;
        }
      }
      // Songs Liked Under filter
      if (userActivityFilters.songsLikedUnder) {
        const threshold = Number(userActivityFilters.songsLikedUnder);
        if (!Number.isNaN(threshold) && Number(user.songsLiked || 0) >= threshold) {
          return false;
        }
      }
      // Songs Liked Over filter
      if (userActivityFilters.songsLikedOver) {
        const threshold = Number(userActivityFilters.songsLikedOver);
        if (!Number.isNaN(threshold) && Number(user.songsLiked || 0) <= threshold) {
          return false;
        }
      }
      // Artists Followed Under filter
      if (userActivityFilters.artistsFollowedUnder) {
        const threshold = Number(userActivityFilters.artistsFollowedUnder);
        if (!Number.isNaN(threshold) && Number(user.artistsFollowed || 0) >= threshold) {
          return false;
        }
      }
      // Artists Followed Over filter
      if (userActivityFilters.artistsFollowedOver) {
        const threshold = Number(userActivityFilters.artistsFollowedOver);
        if (!Number.isNaN(threshold) && Number(user.artistsFollowed || 0) <= threshold) {
          return false;
        }
      }
      // Playlists Created Under filter
      if (userActivityFilters.playlistsCreatedUnder) {
        const threshold = Number(userActivityFilters.playlistsCreatedUnder);
        if (!Number.isNaN(threshold) && Number(user.playlistsCreated || 0) >= threshold) {
          return false;
        }
      }
      // Playlists Created Over filter
      if (userActivityFilters.playlistsCreatedOver) {
        const threshold = Number(userActivityFilters.playlistsCreatedOver);
        if (!Number.isNaN(threshold) && Number(user.playlistsCreated || 0) <= threshold) {
          return false;
        }
      }
      // Albums Liked Under filter
      if (userActivityFilters.albumsLikedUnder) {
        const threshold = Number(userActivityFilters.albumsLikedUnder);
        if (!Number.isNaN(threshold) && Number(user.albumsLiked || 0) >= threshold) {
          return false;
        }
      }
      // Albums Liked Over filter
      if (userActivityFilters.albumsLikedOver) {
        const threshold = Number(userActivityFilters.albumsLikedOver);
        if (!Number.isNaN(threshold) && Number(user.albumsLiked || 0) <= threshold) {
          return false;
        }
      }
      return true;
    });
    
    const filteredArtists = (reportData.artistUsers ?? []).filter((user: any) => {
      // Date of birth filter
      if (artistDobRange.start || artistDobRange.end) {
        if (!isDateWithinRange(user.dateOfBirth, artistDobRange)) {
          return false;
        }
      }
      // Country filter
      if (artistCountryFilter !== 'All Countries' && user.country !== artistCountryFilter) {
        return false;
      }
      // City filter
      if (artistCityFilter !== 'All Cities' && user.city !== artistCityFilter) {
        return false;
      }
      // Songs Released Under filter
      if (artistActivityFilters.songsReleasedUnder) {
        const threshold = Number(artistActivityFilters.songsReleasedUnder);
        if (!Number.isNaN(threshold) && Number(user.songsReleased || 0) >= threshold) {
          return false;
        }
      }
      // Songs Released Over filter
      if (artistActivityFilters.songsReleasedOver) {
        const threshold = Number(artistActivityFilters.songsReleasedOver);
        if (!Number.isNaN(threshold) && Number(user.songsReleased || 0) <= threshold) {
          return false;
        }
      }
      // Albums Released Under filter
      if (artistActivityFilters.albumsReleasedUnder) {
        const threshold = Number(artistActivityFilters.albumsReleasedUnder);
        if (!Number.isNaN(threshold) && Number(user.albumsReleased || 0) >= threshold) {
          return false;
        }
      }
      // Albums Released Over filter
      if (artistActivityFilters.albumsReleasedOver) {
        const threshold = Number(artistActivityFilters.albumsReleasedOver);
        if (!Number.isNaN(threshold) && Number(user.albumsReleased || 0) <= threshold) {
          return false;
        }
      }
      return true;
    });
    
    // Sort filtered listeners
    const sortedListeners = [...filteredListeners].sort((a: any, b: any) => {
      const sortOption = listenerActivitySort;
      
      if (sortOption === 'username-asc') {
        return (a.username || '').toLowerCase().localeCompare((b.username || '').toLowerCase());
      } else if (sortOption === 'username-desc') {
        return (b.username || '').toLowerCase().localeCompare((a.username || '').toLowerCase());
      } else if (sortOption === 'dateOfBirth-asc') {
        const dateA = a.dateOfBirth ? new Date(a.dateOfBirth).getTime() : 0;
        const dateB = b.dateOfBirth ? new Date(b.dateOfBirth).getTime() : 0;
        return dateA - dateB;
      } else if (sortOption === 'dateOfBirth-desc') {
        const dateA = a.dateOfBirth ? new Date(a.dateOfBirth).getTime() : 0;
        const dateB = b.dateOfBirth ? new Date(b.dateOfBirth).getTime() : 0;
        return dateB - dateA;
      } else if (sortOption === 'dateJoined-asc') {
        const dateA = a.dateJoined ? new Date(a.dateJoined).getTime() : 0;
        const dateB = b.dateJoined ? new Date(b.dateJoined).getTime() : 0;
        return dateA - dateB;
      } else if (sortOption === 'dateJoined-desc') {
        const dateA = a.dateJoined ? new Date(a.dateJoined).getTime() : 0;
        const dateB = b.dateJoined ? new Date(b.dateJoined).getTime() : 0;
        return dateB - dateA;
      } else if (sortOption === 'songsPlayed-asc') {
        return Number(a.totalSongsPlayed || 0) - Number(b.totalSongsPlayed || 0);
      } else if (sortOption === 'songsPlayed-desc') {
        return Number(b.totalSongsPlayed || 0) - Number(a.totalSongsPlayed || 0);
      } else if (sortOption === 'songsLiked-asc') {
        return Number(a.songsLiked || 0) - Number(b.songsLiked || 0);
      } else if (sortOption === 'songsLiked-desc') {
        return Number(b.songsLiked || 0) - Number(a.songsLiked || 0);
      } else if (sortOption === 'artistsFollowed-asc') {
        return Number(a.artistsFollowed || 0) - Number(b.artistsFollowed || 0);
      } else if (sortOption === 'artistsFollowed-desc') {
        return Number(b.artistsFollowed || 0) - Number(a.artistsFollowed || 0);
      } else if (sortOption === 'playlistsCreated-asc') {
        return Number(a.playlistsCreated || 0) - Number(b.playlistsCreated || 0);
      } else if (sortOption === 'playlistsCreated-desc') {
        return Number(b.playlistsCreated || 0) - Number(a.playlistsCreated || 0);
      } else if (sortOption === 'albumsLiked-asc') {
        return Number(a.albumsLiked || 0) - Number(b.albumsLiked || 0);
      } else if (sortOption === 'albumsLiked-desc') {
        return Number(b.albumsLiked || 0) - Number(a.albumsLiked || 0);
      } else if (sortOption === 'country-asc') {
        return (a.country || '').localeCompare(b.country || '');
      } else if (sortOption === 'country-desc') {
        return (b.country || '').localeCompare(a.country || '');
      } else if (sortOption === 'city-asc') {
        return (a.city || '').localeCompare(b.city || '');
      } else if (sortOption === 'city-desc') {
        return (b.city || '').localeCompare(a.city || '');
      }
      return 0;
    });
    
    const { items: pagedListeners, pageInfo: listenerPageInfo } = getPaginatedList(
      sortedListeners,
      'userActivity-listeners'
    );
    
    // Sort filtered artists
    const sortedArtists = [...filteredArtists].sort((a: any, b: any) => {
      const sortOption = artistActivitySort;
      
      if (sortOption === 'username-asc') {
        return (a.username || '').toLowerCase().localeCompare((b.username || '').toLowerCase());
      } else if (sortOption === 'username-desc') {
        return (b.username || '').toLowerCase().localeCompare((a.username || '').toLowerCase());
      } else if (sortOption === 'dateOfBirth-asc') {
        const dateA = a.dateOfBirth ? new Date(a.dateOfBirth).getTime() : 0;
        const dateB = b.dateOfBirth ? new Date(b.dateOfBirth).getTime() : 0;
        return dateA - dateB;
      } else if (sortOption === 'dateOfBirth-desc') {
        const dateA = a.dateOfBirth ? new Date(a.dateOfBirth).getTime() : 0;
        const dateB = b.dateOfBirth ? new Date(b.dateOfBirth).getTime() : 0;
        return dateB - dateA;
      } else if (sortOption === 'dateJoined-asc') {
        const dateA = a.dateJoined ? new Date(a.dateJoined).getTime() : 0;
        const dateB = b.dateJoined ? new Date(b.dateJoined).getTime() : 0;
        return dateA - dateB;
      } else if (sortOption === 'dateJoined-desc') {
        const dateA = a.dateJoined ? new Date(a.dateJoined).getTime() : 0;
        const dateB = b.dateJoined ? new Date(b.dateJoined).getTime() : 0;
        return dateB - dateA;
      } else if (sortOption === 'songsReleased-asc') {
        return Number(a.songsReleased || 0) - Number(b.songsReleased || 0);
      } else if (sortOption === 'songsReleased-desc') {
        return Number(b.songsReleased || 0) - Number(a.songsReleased || 0);
      } else if (sortOption === 'albumsReleased-asc') {
        return Number(a.albumsReleased || 0) - Number(b.albumsReleased || 0);
      } else if (sortOption === 'albumsReleased-desc') {
        return Number(b.albumsReleased || 0) - Number(a.albumsReleased || 0);
      } else if (sortOption === 'country-asc') {
        return (a.country || '').localeCompare(b.country || '');
      } else if (sortOption === 'country-desc') {
        return (b.country || '').localeCompare(a.country || '');
      } else if (sortOption === 'city-asc') {
        return (a.city || '').localeCompare(b.city || '');
      } else if (sortOption === 'city-desc') {
        return (b.city || '').localeCompare(a.city || '');
      }
      return 0;
    });
    
    const { items: pagedArtists, pageInfo: artistPageInfo } = getPaginatedList(
      sortedArtists,
      'userActivity-artists'
    );

    return (
      <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-800">User Activity</h3>
          <p className="text-xs text-gray-600">
            {startDateLabel && endDateLabel
              ? `From ${startDateLabel} to ${endDateLabel}`
              : startDateLabel
                ? `Beginning ${startDateLabel}`
                : endDateLabel
                  ? `Through ${endDateLabel}`
                  : 'Covering the selected date range for all included users'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                showEmail ? 'border-red-600 text-red-600 bg-red-50' : 'border-gray-300 text-gray-600 bg-white'
              }`}
              onClick={() => toggleColumn('email')}
            >
              {showEmail ? 'Hide Email' : 'Show Email'}
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                showCountry ? 'border-red-600 text-red-600 bg-red-50' : 'border-gray-300 text-gray-600 bg-white'
              }`}
              onClick={() => toggleColumn('country')}
            >
              {showCountry ? 'Hide Country' : 'Show Country'}
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                showCity ? 'border-red-600 text-red-600 bg-red-50' : 'border-gray-300 text-gray-600 bg-white'
              }`}
              onClick={() => toggleColumn('city')}
            >
              {showCity ? 'Hide City' : 'Show City'}
            </button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {includeListeners && Array.isArray(reportData.listenerUsers) && reportData.listenerUsers.length > 0 && (
            <div className="report-section">
              <div className="flex flex-wrap items-baseline justify-between border-b border-gray-300 pb-2 mb-3 gap-2">
                <div className="flex items-center gap-3">
                  <h4 className="text-base font-semibold text-gray-900 uppercase tracking-wide">
                    Listener Activity Summary
                  </h4>
                  <span className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-gray-700 bg-gray-200 rounded-full">
                    Total Listeners: {filteredListeners.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowListenerActivityFilters(!showListenerActivityFilters)}
                  className="px-3 py-1 text-xs font-semibold rounded-full border border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  {showListenerActivityFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
              </div>
              
              {/* Listener Filters */}
              {showListenerActivityFilters && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
                <h5 className="text-xs font-semibold text-gray-700 mb-3">Filters</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Songs Played Under */}
                  <div>
                    <label htmlFor="filter-songs-played-under" className="block text-xs font-medium text-gray-600 mb-1">
                      Songs Played Under:
                    </label>
                    <input
                      type="number"
                      id="filter-songs-played-under"
                      min="0"
                      value={userActivityFilters.songsPlayedUnder}
                      onChange={(e) => {
                        setUserActivityFilters((prev) => ({ ...prev, songsPlayedUnder: e.target.value }));
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-listeners': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter number"
                    />
                  </div>

                  {/* Songs Played Over */}
                  <div>
                    <label htmlFor="filter-songs-played-over" className="block text-xs font-medium text-gray-600 mb-1">
                      Songs Played Over:
                    </label>
                    <input
                      type="number"
                      id="filter-songs-played-over"
                      min="0"
                      value={userActivityFilters.songsPlayedOver}
                      onChange={(e) => {
                        setUserActivityFilters((prev) => ({ ...prev, songsPlayedOver: e.target.value }));
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-listeners': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter number"
                    />
                  </div>

                  {/* Songs Liked Under */}
                  <div>
                    <label htmlFor="filter-songs-liked-under" className="block text-xs font-medium text-gray-600 mb-1">
                      Songs Liked Under:
                    </label>
                    <input
                      type="number"
                      id="filter-songs-liked-under"
                      min="0"
                      value={userActivityFilters.songsLikedUnder}
                      onChange={(e) => {
                        setUserActivityFilters((prev) => ({ ...prev, songsLikedUnder: e.target.value }));
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-listeners': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter number"
                    />
                  </div>

                  {/* Songs Liked Over */}
                  <div>
                    <label htmlFor="filter-songs-liked-over" className="block text-xs font-medium text-gray-600 mb-1">
                      Songs Liked Over:
                    </label>
                    <input
                      type="number"
                      id="filter-songs-liked-over"
                      min="0"
                      value={userActivityFilters.songsLikedOver}
                      onChange={(e) => {
                        setUserActivityFilters((prev) => ({ ...prev, songsLikedOver: e.target.value }));
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-listeners': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter number"
                    />
                  </div>

                  {/* Artists Followed Under */}
                  <div>
                    <label htmlFor="filter-artists-followed-under" className="block text-xs font-medium text-gray-600 mb-1">
                      Artists Followed Under:
                    </label>
                    <input
                      type="number"
                      id="filter-artists-followed-under"
                      min="0"
                      value={userActivityFilters.artistsFollowedUnder}
                      onChange={(e) => {
                        setUserActivityFilters((prev) => ({ ...prev, artistsFollowedUnder: e.target.value }));
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-listeners': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter number"
                    />
                  </div>

                  {/* Artists Followed Over */}
                  <div>
                    <label htmlFor="filter-artists-followed-over" className="block text-xs font-medium text-gray-600 mb-1">
                      Artists Followed Over:
                    </label>
                    <input
                      type="number"
                      id="filter-artists-followed-over"
                      min="0"
                      value={userActivityFilters.artistsFollowedOver}
                      onChange={(e) => {
                        setUserActivityFilters((prev) => ({ ...prev, artistsFollowedOver: e.target.value }));
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-listeners': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter number"
                    />
                  </div>

                  {/* Playlists Created Under */}
                  <div>
                    <label htmlFor="filter-playlists-created-under" className="block text-xs font-medium text-gray-600 mb-1">
                      Playlists Created Under:
                    </label>
                    <input
                      type="number"
                      id="filter-playlists-created-under"
                      min="0"
                      value={userActivityFilters.playlistsCreatedUnder}
                      onChange={(e) => {
                        setUserActivityFilters((prev) => ({ ...prev, playlistsCreatedUnder: e.target.value }));
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-listeners': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter number"
                    />
                  </div>

                  {/* Playlists Created Over */}
                  <div>
                    <label htmlFor="filter-playlists-created-over" className="block text-xs font-medium text-gray-600 mb-1">
                      Playlists Created Over:
                    </label>
                    <input
                      type="number"
                      id="filter-playlists-created-over"
                      min="0"
                      value={userActivityFilters.playlistsCreatedOver}
                      onChange={(e) => {
                        setUserActivityFilters((prev) => ({ ...prev, playlistsCreatedOver: e.target.value }));
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-listeners': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter number"
                    />
                  </div>

                  {/* Albums Liked Under */}
                  <div>
                    <label htmlFor="filter-albums-liked-under" className="block text-xs font-medium text-gray-600 mb-1">
                      Albums Liked Under:
                    </label>
                    <input
                      type="number"
                      id="filter-albums-liked-under"
                      min="0"
                      value={userActivityFilters.albumsLikedUnder}
                      onChange={(e) => {
                        setUserActivityFilters((prev) => ({ ...prev, albumsLikedUnder: e.target.value }));
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-listeners': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter number"
                    />
                  </div>

                  {/* Albums Liked Over */}
                  <div>
                    <label htmlFor="filter-albums-liked-over" className="block text-xs font-medium text-gray-600 mb-1">
                      Albums Liked Over:
                    </label>
                    <input
                      type="number"
                      id="filter-albums-liked-over"
                      min="0"
                      value={userActivityFilters.albumsLikedOver}
                      onChange={(e) => {
                        setUserActivityFilters((prev) => ({ ...prev, albumsLikedOver: e.target.value }));
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-listeners': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter number"
                    />
                  </div>

                  {/* Date of Birth Start */}
                  <div>
                    <label htmlFor="filter-listener-dob-start" className="block text-xs font-medium text-gray-600 mb-1">
                      Date of Birth Start:
                    </label>
                    <input
                      type="date"
                      id="filter-listener-dob-start"
                      value={listenerDobRange.start}
                      onChange={(event) => {
                        setListenerDobRange((prev) => ({ ...prev, start: event.target.value }));
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-listeners': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  {/* Date of Birth End */}
                  <div>
                    <label htmlFor="filter-listener-dob-end" className="block text-xs font-medium text-gray-600 mb-1">
                      Date of Birth End:
                    </label>
                    <input
                      type="date"
                      id="filter-listener-dob-end"
                      value={listenerDobRange.end}
                      onChange={(event) => {
                        setListenerDobRange((prev) => ({ ...prev, end: event.target.value }));
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-listeners': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label htmlFor="filter-listener-country" className="block text-xs font-medium text-gray-600 mb-1">
                      Country:
                    </label>
                    <select
                      id="filter-listener-country"
                      value={listenerCountryFilter}
                      onChange={(event) => {
                        setListenerCountryFilter(event.target.value);
                        setListenerCityFilter('All Cities'); // Reset city when country changes
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-listeners': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="All Countries">All Countries</option>
                      {listenerCountries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* City */}
                  <div>
                    <label htmlFor="filter-listener-city" className="block text-xs font-medium text-gray-600 mb-1">
                      City:
                    </label>
                    <select
                      id="filter-listener-city"
                      value={listenerCityFilter}
                      onChange={(event) => {
                        setListenerCityFilter(event.target.value);
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-listeners': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      disabled={listenerCountryFilter === 'All Countries' && listenerCities.length === 0}
                    >
                      <option value="All Cities">All Cities</option>
                      {listenerCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              )}
              
              {/* Sort Dropdown */}
              <div className="mb-3">
                <label htmlFor="listener-sort" className="block text-xs font-medium text-gray-600 mb-1">
                  Sort by:
                </label>
                <select
                  id="listener-sort"
                  value={listenerActivitySort}
                  onChange={(e) => {
                    setListenerActivitySort(e.target.value);
                    setPaginationPages((prev) => ({ ...prev, 'userActivity-listeners': 0 }));
                  }}
                  className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="username-asc">Username (A-Z)</option>
                  <option value="username-desc">Username (Z-A)</option>
                  <option value="dateOfBirth-asc">Date of Birth (Oldest First)</option>
                  <option value="dateOfBirth-desc">Date of Birth (Newest First)</option>
                  <option value="dateJoined-asc">Date Joined (Oldest First)</option>
                  <option value="dateJoined-desc">Date Joined (Newest First)</option>
                  <option value="songsPlayed-asc">Songs Played (Low to High)</option>
                  <option value="songsPlayed-desc">Songs Played (High to Low)</option>
                  <option value="songsLiked-asc">Songs Liked (Low to High)</option>
                  <option value="songsLiked-desc">Songs Liked (High to Low)</option>
                  <option value="artistsFollowed-asc">Artists Followed (Low to High)</option>
                  <option value="artistsFollowed-desc">Artists Followed (High to Low)</option>
                  <option value="playlistsCreated-asc">Playlists Created (Low to High)</option>
                  <option value="playlistsCreated-desc">Playlists Created (High to Low)</option>
                  <option value="albumsLiked-asc">Albums Liked (Low to High)</option>
                  <option value="albumsLiked-desc">Albums Liked (High to Low)</option>
                  <option value="country-asc">Country (A-Z)</option>
                  <option value="country-desc">Country (Z-A)</option>
                  <option value="city-asc">City (A-Z)</option>
                  <option value="city-desc">City (Z-A)</option>
                </select>
              </div>
              
              {filteredListeners.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-lg px-5 py-8 text-center text-sm text-gray-500">
                  No listeners match the selected filters.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs md:text-sm border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2.5 py-2 border border-gray-200 text-left font-semibold text-gray-700">Username</th>
                          <th className="px-2.5 py-2 border border-gray-200 text-left font-semibold text-gray-700">Name</th>
                          <th className="px-2.5 py-2 border border-gray-200 text-left font-semibold text-gray-700">Date of Birth</th>
                          {showEmail && (
                            <th className="px-2.5 py-2 border border-gray-200 text-left font-semibold text-gray-700">Email</th>
                          )}
                          <th className="px-2.5 py-2 border border-gray-200 text-left font-semibold text-gray-700">Date Joined</th>
                          {showCountry && (
                            <th className="px-2.5 py-2 border border-gray-200 text-left font-semibold text-gray-700">Country</th>
                          )}
                          {showCity && (
                            <th className="px-2.5 py-2 border border-gray-200 text-left font-semibold text-gray-700">City</th>
                          )}
                          <th className="px-2.5 py-2 border border-gray-200 text-right font-semibold text-gray-700">Songs Played</th>
                          <th className="px-2.5 py-2 border border-gray-200 text-right font-semibold text-gray-700">Songs Liked</th>
                          <th className="px-2.5 py-2 border border-gray-200 text-right font-semibold text-gray-700">Artists Followed</th>
                          <th className="px-2.5 py-2 border border-gray-200 text-right font-semibold text-gray-700">Playlists Created</th>
                          <th className="px-2.5 py-2 border border-gray-200 text-right font-semibold text-gray-700">Albums Liked</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedListeners.map((user: any, idx: number) => (
                          <tr key={`listener-report-${user.username}-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-2.5 py-2 border border-gray-200 text-gray-800">{user.username || 'N/A'}</td>
                            <td className="px-2.5 py-2 border border-gray-200 text-gray-800">
                              {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A'}
                            </td>
                            <td className="px-2.5 py-2 border border-gray-200 text-gray-800">{formatDate(user.dateOfBirth)}</td>
                            {showEmail && (
                              <td className="px-2.5 py-2 border border-gray-200 text-gray-800">{user.email || 'N/A'}</td>
                            )}
                            <td className="px-2.5 py-2 border border-gray-200 text-gray-800">{formatDate(user.dateJoined)}</td>
                            {showCountry && (
                              <td className="px-2.5 py-2 border border-gray-200 text-gray-800">{user.country || 'N/A'}</td>
                            )}
                            {showCity && (
                              <td className="px-2.5 py-2 border border-gray-200 text-gray-800">{user.city || 'N/A'}</td>
                            )}
                            <td className="px-2.5 py-2 border border-gray-200 text-right text-gray-800">
                              {formatNumber(user.totalSongsPlayed)}
                            </td>
                            <td className="px-2.5 py-2 border border-gray-200 text-right text-gray-800">
                              {formatNumber(user.songsLiked)}
                            </td>
                            <td className="px-2.5 py-2 border border-gray-200 text-right text-gray-800">
                              {formatNumber(user.artistsFollowed)}
                            </td>
                            <td className="px-2.5 py-2 border border-gray-200 text-right text-gray-800">
                              {formatNumber(user.playlistsCreated)}
                            </td>
                            <td className="px-2.5 py-2 border border-gray-200 text-right text-gray-800">
                              {formatNumber(user.albumsLiked)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls
                    pageInfo={listenerPageInfo}
                    onPageChange={(page) => setPageForKey('userActivity-listeners', page, listenerPageInfo.pageCount)}
                    className="mt-3"
                  />
                </>
              )}
            </div>
          )}

          {includeArtists && Array.isArray(reportData.artistUsers) && reportData.artistUsers.length > 0 && (
            <div className="report-section">
              <div className="flex flex-wrap items-baseline justify-between border-b border-gray-300 pb-2 mb-3 gap-2">
                <div className="flex items-center gap-3">
                  <h4 className="text-base font-semibold text-gray-900 uppercase tracking-wide">
                    Artist Activity Summary
                  </h4>
                  <span className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-gray-700 bg-gray-200 rounded-full">
                    Total Artists: {filteredArtists.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowArtistActivitySummaryFilters(!showArtistActivitySummaryFilters)}
                  className="px-3 py-1 text-xs font-semibold rounded-full border border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  {showArtistActivitySummaryFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
              </div>
              
              {/* Filters */}
              {showArtistActivitySummaryFilters && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
                <h5 className="text-xs font-semibold text-gray-700 mb-3">Filters</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {/* Date of Birth Start */}
                  <div>
                    <label htmlFor="filter-artist-dob-start" className="block text-xs font-medium text-gray-600 mb-1">
                      Date of Birth Start:
                    </label>
                    <input
                      type="date"
                      id="filter-artist-dob-start"
                      value={artistDobRange.start}
                      onChange={(event) => {
                        setArtistDobRange((prev) => ({ ...prev, start: event.target.value }));
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-artists': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  {/* Date of Birth End */}
                  <div>
                    <label htmlFor="filter-artist-dob-end" className="block text-xs font-medium text-gray-600 mb-1">
                      Date of Birth End:
                    </label>
                    <input
                      type="date"
                      id="filter-artist-dob-end"
                      value={artistDobRange.end}
                      onChange={(event) => {
                        setArtistDobRange((prev) => ({ ...prev, end: event.target.value }));
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-artists': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label htmlFor="filter-artist-country" className="block text-xs font-medium text-gray-600 mb-1">
                      Country:
                    </label>
                    <select
                      id="filter-artist-country"
                      value={artistCountryFilter}
                      onChange={(event) => {
                        setArtistCountryFilter(event.target.value);
                        setArtistCityFilter('All Cities'); // Reset city when country changes
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-artists': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="All Countries">All Countries</option>
                      {artistCountries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* City */}
                  <div>
                    <label htmlFor="filter-artist-city" className="block text-xs font-medium text-gray-600 mb-1">
                      City:
                    </label>
                    <select
                      id="filter-artist-city"
                      value={artistCityFilter}
                      onChange={(event) => {
                        setArtistCityFilter(event.target.value);
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-artists': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      disabled={artistCountryFilter === 'All Countries' && artistCities.length === 0}
                    >
                      <option value="All Cities">All Cities</option>
                      {artistCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Songs Released Under */}
                  <div>
                    <label htmlFor="filter-artist-songs-released-under" className="block text-xs font-medium text-gray-600 mb-1">
                      Songs Released Under:
                    </label>
                    <input
                      type="number"
                      id="filter-artist-songs-released-under"
                      min="0"
                      value={artistActivityFilters.songsReleasedUnder}
                      onChange={(e) => {
                        setArtistActivityFilters((prev) => ({ ...prev, songsReleasedUnder: e.target.value }));
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-artists': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter number"
                    />
                  </div>

                  {/* Songs Released Over */}
                  <div>
                    <label htmlFor="filter-artist-songs-released-over" className="block text-xs font-medium text-gray-600 mb-1">
                      Songs Released Over:
                    </label>
                    <input
                      type="number"
                      id="filter-artist-songs-released-over"
                      min="0"
                      value={artistActivityFilters.songsReleasedOver}
                      onChange={(e) => {
                        setArtistActivityFilters((prev) => ({ ...prev, songsReleasedOver: e.target.value }));
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-artists': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter number"
                    />
                  </div>

                  {/* Albums Released Under */}
                  <div>
                    <label htmlFor="filter-artist-albums-released-under" className="block text-xs font-medium text-gray-600 mb-1">
                      Albums Released Under:
                    </label>
                    <input
                      type="number"
                      id="filter-artist-albums-released-under"
                      min="0"
                      value={artistActivityFilters.albumsReleasedUnder}
                      onChange={(e) => {
                        setArtistActivityFilters((prev) => ({ ...prev, albumsReleasedUnder: e.target.value }));
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-artists': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter number"
                    />
                  </div>

                  {/* Albums Released Over */}
                  <div>
                    <label htmlFor="filter-artist-albums-released-over" className="block text-xs font-medium text-gray-600 mb-1">
                      Albums Released Over:
                    </label>
                    <input
                      type="number"
                      id="filter-artist-albums-released-over"
                      min="0"
                      value={artistActivityFilters.albumsReleasedOver}
                      onChange={(e) => {
                        setArtistActivityFilters((prev) => ({ ...prev, albumsReleasedOver: e.target.value }));
                        setPaginationPages((prev) => ({ ...prev, 'userActivity-artists': 0 }));
                      }}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter number"
                    />
                  </div>
                </div>
              </div>
              )}
              
              {/* Sort Dropdown */}
              <div className="mb-3">
                <label htmlFor="artist-sort" className="block text-xs font-medium text-gray-600 mb-1">
                  Sort by:
                </label>
                <select
                  id="artist-sort"
                  value={artistActivitySort}
                  onChange={(e) => {
                    setArtistActivitySort(e.target.value);
                    setPaginationPages((prev) => ({ ...prev, 'userActivity-artists': 0 }));
                  }}
                  className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="username-asc">Username (A-Z)</option>
                  <option value="username-desc">Username (Z-A)</option>
                  <option value="dateOfBirth-asc">Date of Birth (Oldest First)</option>
                  <option value="dateOfBirth-desc">Date of Birth (Newest First)</option>
                  <option value="dateJoined-asc">Date Joined (Oldest First)</option>
                  <option value="dateJoined-desc">Date Joined (Newest First)</option>
                  <option value="songsReleased-asc">Songs Released (Low to High)</option>
                  <option value="songsReleased-desc">Songs Released (High to Low)</option>
                  <option value="albumsReleased-asc">Albums Released (Low to High)</option>
                  <option value="albumsReleased-desc">Albums Released (High to Low)</option>
                  <option value="country-asc">Country (A-Z)</option>
                  <option value="country-desc">Country (Z-A)</option>
                  <option value="city-asc">City (A-Z)</option>
                  <option value="city-desc">City (Z-A)</option>
                </select>
              </div>
              
              {filteredArtists.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-lg px-5 py-8 text-center text-sm text-gray-500">
                  No artists match the selected filters.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs md:text-sm border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2.5 py-2 border border-gray-200 text-left font-semibold text-gray-700">Username</th>
                          <th className="px-2.5 py-2 border border-gray-200 text-left font-semibold text-gray-700">Name</th>
                          <th className="px-2.5 py-2 border border-gray-200 text-left font-semibold text-gray-700">Date of Birth</th>
                          {showEmail && (
                            <th className="px-2.5 py-2 border border-gray-200 text-left font-semibold text-gray-700">Email</th>
                          )}
                          <th className="px-2.5 py-2 border border-gray-200 text-left font-semibold text-gray-700">Date Joined</th>
                          {showCountry && (
                            <th className="px-2.5 py-2 border border-gray-200 text-left font-semibold text-gray-700">Country</th>
                          )}
                          {showCity && (
                            <th className="px-2.5 py-2 border border-gray-200 text-left font-semibold text-gray-700">City</th>
                          )}
                          <th className="px-2.5 py-2 border border-gray-200 text-right font-semibold text-gray-700">Songs Released</th>
                          <th className="px-2.5 py-2 border border-gray-200 text-right font-semibold text-gray-700">Albums Released</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedArtists.map((user: any, idx: number) => (
                          <tr key={`artist-report-${user.username}-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-2.5 py-2 border border-gray-200 text-gray-800">{user.username || 'N/A'}</td>
                            <td className="px-2.5 py-2 border border-gray-200 text-gray-800">
                              {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A'}
                            </td>
                            <td className="px-2.5 py-2 border border-gray-200 text-gray-800">{formatDate(user.dateOfBirth)}</td>
                            {showEmail && (
                              <td className="px-2.5 py-2 border border-gray-200 text-gray-800">{user.email || 'N/A'}</td>
                            )}
                            <td className="px-2.5 py-2 border border-gray-200 text-gray-800">{formatDate(user.dateJoined)}</td>
                            {showCountry && (
                              <td className="px-2.5 py-2 border border-gray-200 text-gray-800">{user.country || 'N/A'}</td>
                            )}
                            {showCity && (
                              <td className="px-2.5 py-2 border border-gray-200 text-gray-800">{user.city || 'N/A'}</td>
                            )}
                            <td className="px-2.5 py-2 border border-gray-200 text-right text-gray-800">
                              {formatNumber(user.songsReleased)}
                            </td>
                            <td className="px-2.5 py-2 border border-gray-200 text-right text-gray-800">
                              {formatNumber(user.albumsReleased)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls
                    pageInfo={artistPageInfo}
                    onPageChange={(page) => setPageForKey('userActivity-artists', page, artistPageInfo.pageCount)}
                    className="mt-3"
                  />
                </>
              )}
            </div>
          )}

          {!includeListeners && (!includeArtists || reportData.artistUsers?.length === 0) && (
            <div className="bg-white border border-dashed border-gray-300 rounded-lg px-5 py-10 text-center text-gray-500">
              No user activity data available for the selected filters.
                  </div>
        )}
        </div>
      </div>
    );
  };

  const renderIndividualSongActivity = () => {
    if (isIndividualUser) {
      const userType = reportData.userDetails?.userType;
      if (userType === 'Artist') {
        return renderIndividualArtistSongActivity();
      }
      return renderIndividualSongActivity();
    }

    if (!availableSongActivity) {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          No song activity recorded for the selected period.
        </div>
      );
    }

    const songs = [...reportData.songActivity].sort((a: any, b: any) => {
      const artistA = (a?.artistName || '').toLowerCase();
      const artistB = (b?.artistName || '').toLowerCase();
      const comparison = artistB.localeCompare(artistA);
      if (comparison !== 0) return comparison;
      return (b?.songName || '').toLowerCase().localeCompare((a?.songName || '').toLowerCase());
    });

    return (
      <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-800">Song Activity</h3>
          <p className="text-xs text-gray-600">Detailed engagement for songs played during the reporting period</p>
        </div>
        <div className="px-5 py-4 space-y-4">
        {songs.map((song: any, idx: number) => (
          <section
            key={`${song.songId ?? idx}`}
            className="report-section bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            <div className="bg-gray-100 px-5 py-3.5 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{song.songName || 'Unknown Song'}</h3>
                <p className="text-sm text-gray-600">Artist: {song.artistName || 'Unknown Artist'}</p>
                <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-x-6 gap-y-1">
                  <span>Release Date: {formatDate(song.releaseDate)}</span>
                  <span>Genre: {song.genre || 'N/A'}</span>
                  <span>Song Length: {song.duration != null ? formatTime(Number(song.duration)) : 'N/A'}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-5 text-sm text-gray-700">
                <div className="text-center">
                  <p className="font-semibold text-lg text-gray-900">
                    {formatNumber(Number(song.totalListens ?? 0))}
                  </p>
                  <p className="uppercase tracking-wide text-xs text-gray-500">Total Listens</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg text-gray-900">
                    {formatNumber(Number(song.totalLikes ?? 0))}
                  </p>
                  <p className="uppercase tracking-wide text-xs text-gray-500">Total Likes</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg text-gray-900">
                    {formatTime(Number(song.averageListeningTime ?? 0))}
                  </p>
                  <p className="uppercase tracking-wide text-xs text-gray-500">Average Listen Duration</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg text-gray-900">
                    {formatTime(Number(song.totalListeningTime ?? 0))}
                  </p>
                  <p className="uppercase tracking-wide text-xs text-gray-500 whitespace-nowrap">Total Listen Duration</p>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-gray-50">
                  <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="px-3.5 py-2.5 text-left">Listener</th>
                    <th className="px-3.5 py-2.5 text-center">Listens</th>
                    <th className="px-3.5 py-2.5 text-center">Avg Listen Duration</th>
                    <th className="px-3.5 py-2.5 text-center">Total Listen Duration</th>
                    <th className="px-3.5 py-2.5 text-left">Liked?</th>
                    <th className="px-3.5 py-2.5 text-left">Liked On</th>
        </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {song.listenerDetails?.map((listener: any, listenerIdx: number) => (
                    <tr
                      key={`${song.songId ?? idx}-listener-${listenerIdx}`}
                      className={listenerIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                    >
                      <td className="px-3.5 py-2.5 text-sm text-gray-900">{listener.username || 'Unknown User'}</td>
                      <td className="px-3.5 py-2.5 text-sm text-gray-900 text-center">{formatNumber(listener.listenCount || 0)}</td>
                      <td className="px-3.5 py-2.5 text-sm text-gray-900 text-center">{formatTime(listener.averageListeningTime || 0)}</td>
                      <td className="px-3.5 py-2.5 text-sm text-gray-900 text-center">{formatTime(listener.totalListeningTime || 0)}</td>
                      <td className="px-3.5 py-2.5 text-sm text-gray-900">{listener.liked ? 'Liked' : 'Not Liked'}</td>
                      <td className="px-3.5 py-2.5 text-sm text-gray-900">{formatDate(listener.likedAt)}</td>
        </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
        </div>
      </div>
    );
  };

  const renderIndividualArtistSongActivity = () => {
    if (!showSongStats) {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          Song activity reporting is disabled for this export.
        </div>
      );
    }

    const userType = reportData.userDetails?.userType;
    if (userType !== 'Artist') {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          Song activity is only available for artist accounts.
        </div>
      );
    }

    const summary = reportData.artistSongSummary || {};
    const songs = Array.isArray(reportData.artistSongActivity)
      ? [...reportData.artistSongActivity]
      : [];

    const summaryCards = [
      { label: 'Songs Released', value: formatNumber(summary.totalSongsReleased || 0) },
      { label: 'Song Likes', value: formatNumber(summary.totalSongLikes || 0) },
      { label: 'Distinct Song Likers', value: formatNumber(summary.totalDistinctSongLikers || 0) },
      { label: 'Total Listen Duration', value: formatTime(summary.totalListeningDuration || 0) },
      { label: 'Average Listen Duration', value: formatTime(summary.averageListeningDuration || 0) }
    ];

    return (
      <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-800">Song Activity</h3>
          <p className="text-xs text-gray-600">Performance metrics for songs released by this artist</p>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {summaryCards.map((card) => (
              <div key={card.label} className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-center shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">{card.label}</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{card.value}</p>
              </div>
            ))}
          </div>

          {songs.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg px-5 py-10 text-center text-sm text-gray-500">
              No song activity recorded for the selected period.
            </div>
          ) : (
            songs.map((song: any, idx: number) => {
              const listeners = Array.isArray(song.listeners) ? song.listeners : [];
              const likers = Array.isArray(song.likers) ? song.likers : [];

              return (
                <section
                  key={`${song.songId ?? idx}`}
                  className="report-section bg-white border border-gray-200 rounded-lg shadow-sm"
                >
                  <div className="bg-gray-100 px-5 py-3.5 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{song.songName || 'Unknown Song'}</h3>
                      <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-x-6 gap-y-1">
                        <span>Release Date: {formatDate(song.releaseDate)}</span>
                        <span>Album: {song.albumName || 'N/A'}</span>
                        <span>Genre: {song.genre || 'N/A'}</span>
                        <span>Song Length: {song.duration != null ? formatTime(Number(song.duration)) : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-5 text-sm text-gray-700">
                      <div className="text-center">
                        <p className="font-semibold text-lg text-gray-900">{formatNumber(song.totalListens || 0)}</p>
                        <p className="uppercase tracking-wide text-xs text-gray-500">Total Listens</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-lg text-gray-900">{formatNumber(song.totalLikes || 0)}</p>
                        <p className="uppercase tracking-wide text-xs text-gray-500">Total Likes</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-lg text-gray-900">{formatTime(Number(song.totalListeningDuration || 0))}</p>
                        <p className="uppercase tracking-wide text-xs text-gray-500 whitespace-nowrap">Total Listen Duration</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-lg text-gray-900">{formatTime(Number(song.averageListeningDuration || 0))}</p>
                        <p className="uppercase tracking-wide text-xs text-gray-500 whitespace-nowrap">Average Listen Duration</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-4 space-y-6">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                        Users Who Listened
                      </h5>
                      {listeners.length === 0 ? (
                        <div className="border border-dashed border-gray-300 rounded-md px-3 py-4 text-center text-sm text-gray-500">
                          No listeners recorded for this song during the selected period.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                            <thead className="bg-white">
                              <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <th className="px-3.5 py-2.5 text-left">Username</th>
                                <th className="px-3.5 py-2.5 text-left">Name</th>
                                <th className="px-3.5 py-2.5 text-center">Listens</th>
                                <th className="px-3.5 py-2.5 text-center">Total Duration</th>
                                <th className="px-3.5 py-2.5 text-center">Avg Duration</th>
        </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {listeners.map((listener: any, listenerIdx: number) => (
                                <tr
                                  key={`${song.songId ?? idx}-listener-${listener.userId ?? listenerIdx}`}
                                  className={listenerIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                                >
                                  <td className="px-3.5 py-2.5 text-sm text-gray-900">{listener.username || 'Unknown'}</td>
                                  <td className="px-3.5 py-2.5 text-sm text-gray-900">{listener.fullName || 'N/A'}</td>
                                  <td className="px-3.5 py-2.5 text-sm text-gray-900 text-center">{formatNumber(listener.listenCount || 0)}</td>
                                  <td className="px-3.5 py-2.5 text-sm text-gray-900 text-center">{formatTime(listener.totalDuration || 0)}</td>
                                  <td className="px-3.5 py-2.5 text-sm text-gray-900 text-center">{formatTime(listener.averageDuration || 0)}</td>
        </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div>
                      <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                        Users Who Liked This Song
                      </h5>
                      {likers.length === 0 ? (
                        <div className="border border-dashed border-gray-300 rounded-md px-3 py-4 text-center text-sm text-gray-500">
                          No likes were recorded for this song during the selected period.
                  </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                            <thead className="bg-white">
                              <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <th className="px-3.5 py-2.5 text-left">Username</th>
                                <th className="px-3.5 py-2.5 text-left">Name</th>
                                <th className="px-3.5 py-2.5 text-left">Email</th>
                                <th className="px-3.5 py-2.5 text-left">Liked On</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {likers.map((liker: any, likerIdx: number) => (
                                <tr
                                  key={`${song.songId ?? idx}-liker-${liker.userId ?? likerIdx}`}
                                  className={likerIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                                >
                                  <td className="px-3.5 py-2.5 text-sm text-gray-900">{liker.username || 'Unknown'}</td>
                                  <td className="px-3.5 py-2.5 text-sm text-gray-900">{liker.fullName || 'N/A'}</td>
                                  <td className="px-3.5 py-2.5 text-sm text-gray-700 break-all">{liker.email || 'N/A'}</td>
                                  <td className="px-3.5 py-2.5 text-sm text-gray-900">{formatDateTime(liker.likedAt)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
              </div>
                      )}
                    </div>
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderIndividualListenerArtistActivity = () => {
    if (!showArtistStats) {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          Artist activity reporting is disabled for this export.
                  </div>
      );
    }

    const userType = reportData.userDetails?.userType;
    if (userType !== 'Listener') {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          Artist activity is only available for listener accounts.
        </div>
      );
    }

    const allArtists = Array.isArray(reportData.listenerArtistActivity)
      ? [...reportData.listenerArtistActivity].sort((a: any, b: any) => {
          const usernameA = (a?.username || '').toLowerCase();
          const usernameB = (b?.username || '').toLowerCase();
          return usernameA.localeCompare(usernameB);
        })
      : [];

    // Extract unique countries and cities for filter options
    const uniqueCountries = Array.from(
      new Set(allArtists.map((artist: any) => artist.country).filter(Boolean))
    ).sort();
    
    // Get cities filtered by selected countries
    const getAvailableCities = () => {
      if (artistFilters.selectedCountries.length === 0) {
        // If no countries selected, show all cities
        return Array.from(
          new Set(allArtists.map((artist: any) => artist.city).filter(Boolean))
        ).sort();
      } else {
        // Only show cities from selected countries
        return Array.from(
          new Set(
            allArtists
              .filter((artist: any) => 
                artist.country && artistFilters.selectedCountries.includes(artist.country)
              )
              .map((artist: any) => artist.city)
              .filter(Boolean)
          )
        ).sort();
      }
    };
    const availableCities = getAvailableCities();

    // Helper function to parse time to seconds (HH:MM:SS format)
    const parseTimeToSeconds = (timeStr: string): number => {
      if (!timeStr || !timeStr.trim()) return 0;
      const digitsOnly = timeStr.trim().replace(/\D/g, '');
      if (digitsOnly.length === 0) return 0;
      const padded = digitsOnly.padStart(6, '0');
      const hours = parseInt(padded.substring(0, 2), 10) || 0;
      const minutes = parseInt(padded.substring(2, 4), 10) || 0;
      const seconds = parseInt(padded.substring(4, 6), 10) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    };

    // Apply filters
    const filteredArtists = allArtists.filter((artist: any) => {
      // Verified filter
      if (artistFilters.verified !== 'All') {
        if (artistFilters.verified === 'Verified' && !artist.verified) return false;
        if (artistFilters.verified === 'Not Verified' && artist.verified) return false;
      }

      // Country filter (checkable list)
      if (artistFilters.selectedCountries.length > 0) {
        const artistCountry = artist.country ? String(artist.country).trim() : '';
        if (!artistFilters.selectedCountries.includes(artistCountry)) {
          return false;
        }
      }

      // City filter (checkable list, dependent on countries)
      if (artistFilters.selectedCities.length > 0) {
        const artistCity = artist.city ? String(artist.city).trim() : '';
        if (!artistFilters.selectedCities.includes(artistCity)) {
          return false;
        }
      }

      // Songs Liked Under filter
      if (artistFilters.songsLikedUnder) {
        const threshold = Number(artistFilters.songsLikedUnder);
        const songsLiked = Number(artist.songsLikedCount || 0);
        if (!Number.isNaN(threshold) && songsLiked >= threshold) {
          return false;
        }
      }

      // Songs Liked Over filter
      if (artistFilters.songsLikedOver) {
        const threshold = Number(artistFilters.songsLikedOver);
        const songsLiked = Number(artist.songsLikedCount || 0);
        if (!Number.isNaN(threshold) && songsLiked <= threshold) {
          return false;
        }
      }

      // Songs Listened Under filter
      if (artistFilters.songsListenedUnder) {
        const threshold = Number(artistFilters.songsListenedUnder);
        const songsListened = Number(artist.songsListenedCount || 0);
        if (!Number.isNaN(threshold) && songsListened >= threshold) {
          return false;
        }
      }

      // Songs Listened Over filter
      if (artistFilters.songsListenedOver) {
        const threshold = Number(artistFilters.songsListenedOver);
        const songsListened = Number(artist.songsListenedCount || 0);
        if (!Number.isNaN(threshold) && songsListened <= threshold) {
          return false;
        }
      }

      // Albums Liked Under filter
      if (artistFilters.albumsLikedUnder) {
        const threshold = Number(artistFilters.albumsLikedUnder);
        const albumsLiked = Number(artist.albumsLikedCount || 0);
        if (!Number.isNaN(threshold) && albumsLiked >= threshold) {
          return false;
        }
      }

      // Albums Liked Over filter
      if (artistFilters.albumsLikedOver) {
        const threshold = Number(artistFilters.albumsLikedOver);
        const albumsLiked = Number(artist.albumsLikedCount || 0);
        if (!Number.isNaN(threshold) && albumsLiked <= threshold) {
          return false;
        }
      }

      // Total Listen Time Under filter
      if (artistFilters.totalListenTimeUnder) {
        const thresholdSeconds = parseTimeToSeconds(artistFilters.totalListenTimeUnder);
        const totalListenTimeSeconds = Number(artist.totalListeningDuration || 0);
        if (thresholdSeconds > 0 && totalListenTimeSeconds >= thresholdSeconds) {
          return false;
        }
      }

      // Total Listen Time Over filter
      if (artistFilters.totalListenTimeOver) {
        const thresholdSeconds = parseTimeToSeconds(artistFilters.totalListenTimeOver);
        const totalListenTimeSeconds = Number(artist.totalListeningDuration || 0);
        if (thresholdSeconds > 0 && totalListenTimeSeconds <= thresholdSeconds) {
          return false;
        }
      }

      return true;
    });

    if (allArtists.length === 0) {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          No artist activity recorded for the selected period.
        </div>
      );
    }

    return (
      <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Artist Activity</h3>
              <p className="text-xs text-gray-600">Artists followed by this listener during the reporting period</p>
            </div>
            <button
              type="button"
              onClick={() => setShowIndividualArtistFilters(!showIndividualArtistFilters)}
              className="px-3 py-1 text-xs font-semibold rounded-full border border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              {showIndividualArtistFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Filters */}
          {showIndividualArtistFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Filters</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {/* Verified Filter */}
              <div>
                <label htmlFor="filter-artist-verified" className="block text-xs font-medium text-gray-600 mb-1">
                  Verified Status
                </label>
                <select
                  id="filter-artist-verified"
                  value={artistFilters.verified}
                  onChange={(e) => {
                    setArtistFilters((prev) => ({ ...prev, verified: e.target.value }));
                  }}
                  className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="All">All</option>
                  <option value="Verified">Verified</option>
                  <option value="Not Verified">Not Verified</option>
                </select>
              </div>

              {/* Songs Liked Under */}
              <div>
                <label htmlFor="filter-artist-songs-liked-under" className="block text-xs font-medium text-gray-600 mb-1">
                  Songs Liked Under:
                </label>
                <input
                  type="number"
                  id="filter-artist-songs-liked-under"
                  min="0"
                  value={artistFilters.songsLikedUnder}
                  onChange={(e) => {
                    setArtistFilters((prev) => ({ ...prev, songsLikedUnder: e.target.value }));
                  }}
                  className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter number"
                />
              </div>

              {/* Songs Liked Over */}
              <div>
                <label htmlFor="filter-artist-songs-liked-over" className="block text-xs font-medium text-gray-600 mb-1">
                  Songs Liked Over:
                </label>
                <input
                  type="number"
                  id="filter-artist-songs-liked-over"
                  min="0"
                  value={artistFilters.songsLikedOver}
                  onChange={(e) => {
                    setArtistFilters((prev) => ({ ...prev, songsLikedOver: e.target.value }));
                  }}
                  className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter number"
                />
              </div>

              {/* Songs Listened Under */}
              <div>
                <label htmlFor="filter-artist-songs-listened-under" className="block text-xs font-medium text-gray-600 mb-1">
                  Songs Listened Under:
                </label>
                <input
                  type="number"
                  id="filter-artist-songs-listened-under"
                  min="0"
                  value={artistFilters.songsListenedUnder}
                  onChange={(e) => {
                    setArtistFilters((prev) => ({ ...prev, songsListenedUnder: e.target.value }));
                  }}
                  className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter number"
                />
              </div>

              {/* Songs Listened Over */}
              <div>
                <label htmlFor="filter-artist-songs-listened-over" className="block text-xs font-medium text-gray-600 mb-1">
                  Songs Listened Over:
                </label>
                <input
                  type="number"
                  id="filter-artist-songs-listened-over"
                  min="0"
                  value={artistFilters.songsListenedOver}
                  onChange={(e) => {
                    setArtistFilters((prev) => ({ ...prev, songsListenedOver: e.target.value }));
                  }}
                  className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter number"
                />
              </div>

              {/* Albums Liked Under */}
              <div>
                <label htmlFor="filter-artist-albums-liked-under" className="block text-xs font-medium text-gray-600 mb-1">
                  Albums Liked Under:
                </label>
                <input
                  type="number"
                  id="filter-artist-albums-liked-under"
                  min="0"
                  value={artistFilters.albumsLikedUnder}
                  onChange={(e) => {
                    setArtistFilters((prev) => ({ ...prev, albumsLikedUnder: e.target.value }));
                  }}
                  className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter number"
                />
              </div>

              {/* Albums Liked Over */}
              <div>
                <label htmlFor="filter-artist-albums-liked-over" className="block text-xs font-medium text-gray-600 mb-1">
                  Albums Liked Over:
                </label>
                <input
                  type="number"
                  id="filter-artist-albums-liked-over"
                  min="0"
                  value={artistFilters.albumsLikedOver}
                  onChange={(e) => {
                    setArtistFilters((prev) => ({ ...prev, albumsLikedOver: e.target.value }));
                  }}
                  className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter number"
                />
              </div>

              {/* Total Listen Time Under */}
              <div>
                <label htmlFor="filter-artist-total-listen-time-under" className="block text-xs font-medium text-gray-600 mb-1">
                  Total Listen Time Under:
                </label>
                <input
                  type="text"
                  id="filter-artist-total-listen-time-under"
                  value={(() => {
                    const raw = artistFilters.totalListenTimeUnder;
                    if (!raw) return '';
                    if (raw.length <= 2) {
                      return raw;
                    } else if (raw.length <= 4) {
                      const hh = raw.substring(0, 2);
                      const mm = raw.substring(2);
                      return `${hh}:${mm}`;
                    } else {
                      const hh = raw.substring(0, 2);
                      const mm = raw.substring(2, 4);
                      const ss = raw.substring(4);
                      return `${hh}:${mm}:${ss}`;
                    }
                  })()}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setArtistFilters((prev) => ({ ...prev, totalListenTimeUnder: raw }));
                  }}
                  className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="HH:MM:SS"
                  maxLength={8}
                />
              </div>

              {/* Total Listen Time Over */}
              <div>
                <label htmlFor="filter-artist-total-listen-time-over" className="block text-xs font-medium text-gray-600 mb-1">
                  Total Listen Time Over:
                </label>
                <input
                  type="text"
                  id="filter-artist-total-listen-time-over"
                  value={(() => {
                    const raw = artistFilters.totalListenTimeOver;
                    if (!raw) return '';
                    if (raw.length <= 2) {
                      return raw;
                    } else if (raw.length <= 4) {
                      const hh = raw.substring(0, 2);
                      const mm = raw.substring(2);
                      return `${hh}:${mm}`;
                    } else {
                      const hh = raw.substring(0, 2);
                      const mm = raw.substring(2, 4);
                      const ss = raw.substring(4);
                      return `${hh}:${mm}:${ss}`;
                    }
                  })()}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setArtistFilters((prev) => ({ ...prev, totalListenTimeOver: raw }));
                  }}
                  className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="HH:MM:SS"
                  maxLength={8}
                />
              </div>
            </div>

            {/* Countries Checklist */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Countries:
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
                {uniqueCountries.length === 0 ? (
                  <p className="text-xs text-gray-500">No countries available</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {uniqueCountries.map((country) => (
                      <label key={country} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={artistFilters.selectedCountries.includes(country)}
                          onChange={(e) => {
                            const currentCountries = artistFilters.selectedCountries;
                            const newCountries = e.target.checked
                              ? [...currentCountries, country]
                              : currentCountries.filter(c => c !== country);
                            // When unchecking a country, remove cities from that country from selectedCities
                            const citiesToRemove = allArtists
                              .filter((artist: any) => artist.country === country)
                              .map((artist: any) => artist.city)
                              .filter(Boolean);
                            const newCities = artistFilters.selectedCities.filter(
                              city => !citiesToRemove.includes(city)
                            );
                            setArtistFilters((prev) => ({ 
                              ...prev, 
                              selectedCountries: newCountries,
                              selectedCities: newCities
                            }));
                          }}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-xs text-gray-700">{country}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cities Checklist */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Cities:
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
                {availableCities.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    {artistFilters.selectedCountries.length === 0 
                      ? 'No cities available' 
                      : 'No cities available for selected countries'}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {availableCities.map((city) => (
                      <label key={city} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={artistFilters.selectedCities.includes(city)}
                          onChange={(e) => {
                            const currentCities = artistFilters.selectedCities;
                            const newCities = e.target.checked
                              ? [...currentCities, city]
                              : currentCities.filter(c => c !== city);
                            setArtistFilters((prev) => ({ ...prev, selectedCities: newCities }));
                          }}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-xs text-gray-700">{city}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
              
          {/* Sort Dropdown */}
          <div className="mb-3">
                <label htmlFor="artist-sort" className="block text-xs font-medium text-gray-600 mb-1">
                  Sort by:
                </label>
                <select
                  id="artist-sort"
                  value={artistActivitySort}
                  onChange={(e) => {
                    setArtistActivitySort(e.target.value);
                    setPaginationPages((prev) => ({ ...prev, 'userActivity-artists': 0 }));
                  }}
                  className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="username-asc">Username (A-Z)</option>
                  <option value="username-desc">Username (Z-A)</option>
                  <option value="dateOfBirth-asc">Date of Birth (Oldest First)</option>
                  <option value="dateOfBirth-desc">Date of Birth (Newest First)</option>
                  <option value="dateJoined-asc">Date Joined (Oldest First)</option>
                  <option value="dateJoined-desc">Date Joined (Newest First)</option>
                  <option value="songsReleased-asc">Songs Released (Low to High)</option>
                  <option value="songsReleased-desc">Songs Released (High to Low)</option>
                  <option value="albumsReleased-asc">Albums Released (Low to High)</option>
                  <option value="albumsReleased-desc">Albums Released (High to Low)</option>
                  <option value="country-asc">Country (A-Z)</option>
                  <option value="country-desc">Country (Z-A)</option>
                  <option value="city-asc">City (A-Z)</option>
                  <option value="city-desc">City (Z-A)</option>
                </select>
              </div>
              
              {filteredArtists.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg px-5 py-10 text-center text-sm text-gray-500">
              No artists match the selected filters.
            </div>
          ) : (
            filteredArtists.map((artist: any, idx: number) => {
            const locationParts = [artist.city, artist.country]
              .map((part: string | null) => (part ? String(part).trim() : ''))
              .filter((part: string) => Boolean(part) && part.toLowerCase() !== 'n/a');
            const location = locationParts.length > 0 ? locationParts.join(', ') : 'N/A';

            return (
              <section
                key={`${artist.artistId ?? artist.username ?? idx}`}
                className="report-section bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <div className="bg-gray-100 px-5 py-3.5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-gray-900">{artist.username || 'Unknown Artist'}</h3>
                      {artist.verified && (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold shadow">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{artist.fullName || 'N/A'}</p>
                    <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Location: {location}</span>
                      <span>Followed On: {formatDate(artist.followedAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                    <div className="text-center min-w-[110px]">
                      <p className="font-semibold text-lg text-gray-900">{formatNumber(artist.songsLikedCount || 0)}</p>
                      <p className="uppercase tracking-wide text-xs text-gray-500">Songs Liked</p>
                    </div>
                    <div className="text-center min-w-[110px]">
                      <p className="font-semibold text-lg text-gray-900">{formatNumber(artist.songsListenedCount || 0)}</p>
                      <p className="uppercase tracking-wide text-xs text-gray-500">Songs Listened</p>
                    </div>
                    <div className="text-center min-w-[110px]">
                      <p className="font-semibold text-lg text-gray-900">{formatNumber(artist.albumsLikedCount || 0)}</p>
                      <p className="uppercase tracking-wide text-xs text-gray-500">Albums Liked</p>
                    </div>
                    <div className="text-center min-w-[130px]">
                      <p className="font-semibold text-lg text-gray-900">{formatTime(Number(artist.totalListeningDuration || 0))}</p>
                      <p className="uppercase tracking-wide text-xs text-gray-500 whitespace-nowrap">Total Listen Time</p>
                    </div>
                  </div>
                </div>
              </section>
            );
            })
          )}
        </div>
      </div>
    );
  };

  const renderIndividualListenerAlbumActivity = () => {
    const userType = reportData.userDetails?.userType;
    if (userType !== 'Listener') {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          Album activity is only available for listener accounts.
        </div>
      );
    }

    const allAlbums = Array.isArray(reportData.listenerAlbumActivity)
      ? [...reportData.listenerAlbumActivity]
      : [];

    // Extract unique artists for filter options
    const uniqueArtists = Array.from(
      new Set(allAlbums.map((album: any) => album.artistUsername).filter(Boolean))
    ).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    // Helper function to parse time to seconds (HH:MM:SS format)
    const parseTimeToSeconds = (timeStr: string): number => {
      if (!timeStr || !timeStr.trim()) return 0;
      const digitsOnly = timeStr.trim().replace(/\D/g, '');
      if (digitsOnly.length === 0) return 0;
      const padded = digitsOnly.padStart(6, '0');
      const hours = parseInt(padded.substring(0, 2), 10) || 0;
      const minutes = parseInt(padded.substring(2, 4), 10) || 0;
      const seconds = parseInt(padded.substring(4, 6), 10) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    };

    // Apply filters
    const filteredAlbums = allAlbums.filter((album: any) => {
      // Artist filter (checkable list)
      if (individualListenerAlbumFilters.selectedArtists.length > 0) {
        const albumArtist = album.artistUsername ? String(album.artistUsername).toLowerCase().trim() : '';
        const selectedArtistsLower = individualListenerAlbumFilters.selectedArtists.map(a => a.toLowerCase().trim());
        if (!selectedArtistsLower.includes(albumArtist)) {
          return false;
        }
      }

      // Listen Time Under filter
      if (individualListenerAlbumFilters.listenTimeUnder) {
        const thresholdSeconds = parseTimeToSeconds(individualListenerAlbumFilters.listenTimeUnder);
        const listenTimeSeconds = Number(album.totalListeningDuration || 0);
        if (thresholdSeconds > 0 && listenTimeSeconds >= thresholdSeconds) {
          return false;
        }
      }

      // Listen Time Over filter
      if (individualListenerAlbumFilters.listenTimeOver) {
        const thresholdSeconds = parseTimeToSeconds(individualListenerAlbumFilters.listenTimeOver);
        const listenTimeSeconds = Number(album.totalListeningDuration || 0);
        if (thresholdSeconds > 0 && listenTimeSeconds <= thresholdSeconds) {
          return false;
        }
      }

      // Verified filter
      if (individualListenerAlbumFilters.verified !== 'All') {
        // Note: We need to check if the artist is verified. This might require checking the artist data
        // For now, we'll assume the album doesn't have verified status directly
        // If the data structure doesn't include verified status, we may need to skip this filter
        // or get it from a different source
        const isVerified = album.artistVerified ?? false;
        if (individualListenerAlbumFilters.verified === 'Verified' && !isVerified) {
          return false;
        }
        if (individualListenerAlbumFilters.verified === 'Not Verified' && isVerified) {
          return false;
        }
      }

      return true;
    });

    // Sort filtered albums
    const sortedAlbums = [...filteredAlbums].sort((a: any, b: any) => {
      const sortOption = individualListenerAlbumActivitySort;
      let comparison = 0;

      if (sortOption === 'albumName-asc') {
        comparison = (a?.albumName || '').toLowerCase().localeCompare((b?.albumName || '').toLowerCase());
      } else if (sortOption === 'albumName-desc') {
        comparison = (b?.albumName || '').toLowerCase().localeCompare((a?.albumName || '').toLowerCase());
      } else if (sortOption === 'releaseDate-asc') {
        const dateA = a?.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const dateB = b?.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        comparison = dateA - dateB;
      } else if (sortOption === 'releaseDate-desc') {
        const dateA = a?.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const dateB = b?.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        comparison = dateB - dateA;
      } else if (sortOption === 'artistUsername-asc') {
        const artistA = (a?.artistUsername || '').toLowerCase();
        const artistB = (b?.artistUsername || '').toLowerCase();
        comparison = artistA.localeCompare(artistB);
      } else if (sortOption === 'artistUsername-desc') {
        const artistA = (a?.artistUsername || '').toLowerCase();
        const artistB = (b?.artistUsername || '').toLowerCase();
        comparison = artistB.localeCompare(artistA);
      } else if (sortOption === 'likedOn-asc') {
        const dateA = a?.likedAt ? new Date(a.likedAt).getTime() : 0;
        const dateB = b?.likedAt ? new Date(b.likedAt).getTime() : 0;
        comparison = dateA - dateB;
      } else if (sortOption === 'likedOn-desc') {
        const dateA = a?.likedAt ? new Date(a.likedAt).getTime() : 0;
        const dateB = b?.likedAt ? new Date(b.likedAt).getTime() : 0;
        comparison = dateB - dateA;
      } else if (sortOption === 'songsLiked-asc') {
        comparison = Number(a?.songsLikedCount || 0) - Number(b?.songsLikedCount || 0);
      } else if (sortOption === 'songsLiked-desc') {
        comparison = Number(b?.songsLikedCount || 0) - Number(a?.songsLikedCount || 0);
      } else if (sortOption === 'totalListenTime-asc') {
        comparison = Number(a?.totalListeningDuration || 0) - Number(b?.totalListeningDuration || 0);
      } else if (sortOption === 'totalListenTime-desc') {
        comparison = Number(b?.totalListeningDuration || 0) - Number(a?.totalListeningDuration || 0);
      }

      return comparison;
    });

    if (allAlbums.length === 0) {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          No album activity recorded for the selected period.
        </div>
      );
    }

    return (
      <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Album Activity</h3>
              <p className="text-xs text-gray-600">Albums this listener liked during the reporting period</p>
            </div>
            <button
              type="button"
              onClick={() => setShowIndividualAlbumFilters(!showIndividualAlbumFilters)}
              className="px-3 py-1 text-xs font-semibold rounded-full border border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              {showIndividualAlbumFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Filters */}
          {showIndividualAlbumFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Filters</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {/* Verified Filter */}
                <div>
                  <label htmlFor="filter-album-verified" className="block text-xs font-medium text-gray-600 mb-1">
                    Verified Status
                  </label>
                  <select
                    id="filter-album-verified"
                    value={individualListenerAlbumFilters.verified}
                    onChange={(e) => {
                      setIndividualListenerAlbumFilters((prev) => ({ 
                        ...prev, 
                        verified: e.target.value as 'Verified' | 'Not Verified' | 'All'
                      }));
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="All">All</option>
                    <option value="Verified">Verified</option>
                    <option value="Not Verified">Not Verified</option>
                  </select>
                </div>

                {/* Listen Time Under */}
                <div>
                  <label htmlFor="filter-album-listen-time-under" className="block text-xs font-medium text-gray-600 mb-1">
                    Listen Time Under:
                  </label>
                  <input
                    type="text"
                    id="filter-album-listen-time-under"
                    value={(() => {
                      const raw = individualListenerAlbumFilters.listenTimeUnder;
                      if (!raw) return '';
                      if (raw.length <= 2) {
                        return raw;
                      } else if (raw.length <= 4) {
                        const hh = raw.substring(0, 2);
                        const mm = raw.substring(2);
                        return `${hh}:${mm}`;
                      } else {
                        const hh = raw.substring(0, 2);
                        const mm = raw.substring(2, 4);
                        const ss = raw.substring(4);
                        return `${hh}:${mm}:${ss}`;
                      }
                    })()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setIndividualListenerAlbumFilters((prev) => ({ ...prev, listenTimeUnder: raw }));
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="HH:MM:SS"
                    maxLength={8}
                  />
                </div>

                {/* Listen Time Over */}
                <div>
                  <label htmlFor="filter-album-listen-time-over" className="block text-xs font-medium text-gray-600 mb-1">
                    Listen Time Over:
                  </label>
                  <input
                    type="text"
                    id="filter-album-listen-time-over"
                    value={(() => {
                      const raw = individualListenerAlbumFilters.listenTimeOver;
                      if (!raw) return '';
                      if (raw.length <= 2) {
                        return raw;
                      } else if (raw.length <= 4) {
                        const hh = raw.substring(0, 2);
                        const mm = raw.substring(2);
                        return `${hh}:${mm}`;
                      } else {
                        const hh = raw.substring(0, 2);
                        const mm = raw.substring(2, 4);
                        const ss = raw.substring(4);
                        return `${hh}:${mm}:${ss}`;
                      }
                    })()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setIndividualListenerAlbumFilters((prev) => ({ ...prev, listenTimeOver: raw }));
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="HH:MM:SS"
                    maxLength={8}
                  />
                </div>
              </div>

              {/* Artists Checklist */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Artists:
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
                  {uniqueArtists.length === 0 ? (
                    <p className="text-xs text-gray-500">No artists available</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {uniqueArtists.map((artist) => (
                        <label key={artist} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={individualListenerAlbumFilters.selectedArtists.includes(artist)}
                            onChange={(e) => {
                              const currentArtists = individualListenerAlbumFilters.selectedArtists;
                              const newArtists = e.target.checked
                                ? [...currentArtists, artist]
                                : currentArtists.filter(a => a !== artist);
                              setIndividualListenerAlbumFilters((prev) => ({ ...prev, selectedArtists: newArtists }));
                            }}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-xs text-gray-700">{artist}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sort Dropdown */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-5 py-3">
            <div className="flex items-center gap-3">
              <label htmlFor="sort-individual-listener-album-activity" className="text-xs font-medium text-gray-600 whitespace-nowrap">
                Sort by:
              </label>
              <select
                id="sort-individual-listener-album-activity"
                value={individualListenerAlbumActivitySort}
                onChange={(e) => {
                  setIndividualListenerAlbumActivitySort(e.target.value);
                }}
                className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="albumName-asc">Album Name (A-Z)</option>
                <option value="albumName-desc">Album Name (Z-A)</option>
                <option value="releaseDate-asc">Release Date (Oldest First)</option>
                <option value="releaseDate-desc">Release Date (Newest First)</option>
                <option value="artistUsername-asc">Artist Username (A-Z)</option>
                <option value="artistUsername-desc">Artist Username (Z-A)</option>
                <option value="likedOn-asc">Liked On Date (Oldest First)</option>
                <option value="likedOn-desc">Liked On Date (Newest First)</option>
                <option value="songsLiked-asc">Songs Liked (Lowest to Highest)</option>
                <option value="songsLiked-desc">Songs Liked (Highest to Lowest)</option>
                <option value="totalListenTime-asc">Total Listen Time (Shortest to Longest)</option>
                <option value="totalListenTime-desc">Total Listen Time (Longest to Shortest)</option>
              </select>
            </div>
          </div>

          {filteredAlbums.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg px-5 py-10 text-center text-sm text-gray-500">
              {allAlbums.length === 0
                ? 'No album activity recorded for the selected period.'
                : 'No albums match the selected filters.'}
            </div>
          ) : (
            sortedAlbums.map((album: any, idx: number) => {
            const albumKey = `album-${album.albumId ?? idx}`;
            const likedSongsExpanded = expandedAlbumLikedSongs[albumKey] ?? false;
            const likedSongs = Array.isArray(album.likedSongs) ? album.likedSongs : [];
            
            return (
              <section
                key={`${album.albumId ?? idx}`}
                className="report-section bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <div className="bg-gray-100 px-5 py-3.5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{album.albumName || 'Untitled Album'}</h3>
                    <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-x-5 gap-y-1">
                      <span>Release Date: {formatDate(album.releaseDate)}</span>
                      <span>Artist: {album.artistUsername || 'Unknown Artist'}</span>
                      <span>Liked On: {formatDate(album.likedAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                    <div className="text-center min-w-[110px]">
                      <p className="font-semibold text-lg text-gray-900">{formatNumber(album.songsLikedCount || 0)}</p>
                      <p className="uppercase tracking-wide text-xs text-gray-500">Songs Liked</p>
                    </div>
                    <div className="text-center min-w-[130px]">
                      <p className="font-semibold text-lg text-gray-900">{formatTime(Number(album.totalListeningDuration || 0))}</p>
                      <p className="uppercase tracking-wide text-xs text-gray-500 whitespace-nowrap">Listen Time</p>
                    </div>
                  </div>
                </div>

                {likedSongs.length > 0 && (
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Liked Songs on This Album
                      </h5>
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedAlbumLikedSongs((prev) => ({
                            ...prev,
                            [albumKey]: !prev[albumKey]
                          }));
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        aria-expanded={likedSongsExpanded}
                      >
                        {likedSongsExpanded ? 'Hide songs' : 'Show songs'}
                      </button>
                    </div>
                    {likedSongsExpanded && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                          <thead className="bg-gray-50">
                            <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              <th className="px-3.5 py-2.5 text-left">Song Name</th>
                              <th className="px-3.5 py-2.5 text-left">Liked On</th>
                              <th className="px-3.5 py-2.5 text-center">Times Listened</th>
                              <th className="px-3.5 py-2.5 text-center">Total Listen Duration</th>
                              <th className="px-3.5 py-2.5 text-center">Average Listen Duration</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {likedSongs.map((song: any, songIdx: number) => (
                              <tr
                                key={`${album.albumId ?? idx}-liked-song-${song.songId ?? songIdx}`}
                                className={songIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                              >
                                <td className="px-3.5 py-2.5 text-sm text-gray-900">{song.songName || 'Unknown Song'}</td>
                                <td className="px-3.5 py-2.5 text-sm text-gray-900">{formatDate(song.likedAt)}</td>
                                <td className="px-3.5 py-2.5 text-sm text-gray-900 text-center">{formatNumber(song.listenCount || 0)}</td>
                                <td className="px-3.5 py-2.5 text-sm text-gray-900 text-center">{formatTime(Number(song.totalListenDuration || 0))}</td>
                                <td className="px-3.5 py-2.5 text-sm text-gray-900 text-center">{formatTime(Number(song.averageListenDuration || 0))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
            })
          )}
        </div>
      </div>
    );
  };

  const renderIndividualArtistAlbumActivity = () => {
    const userType = reportData.userDetails?.userType;
    if (userType !== 'Artist') {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          Album activity is only available for artist accounts.
        </div>
      );
    }

    const albums = Array.isArray(reportData.artistAlbumActivity)
      ? [...reportData.artistAlbumActivity]
      : [];

    if (albums.length === 0) {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          No album activity recorded for the selected period.
        </div>
      );
    }

    return (
      <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-800">Album Activity</h3>
          <p className="text-xs text-gray-600">Albums released by this artist and their performance</p>
        </div>
        <div className="px-5 py-4 space-y-4">
          {albums.map((album: any, idx: number) => {
            const songs = Array.isArray(album.songs) ? album.songs : [];

            return (
              <section
                key={`${album.albumId ?? idx}`}
                className="report-section bg-white border border-gray-200 rounded-lg shadow-sm space-y-4"
              >
                <div className="bg-gray-100 px-5 py-3.5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{album.albumName || 'Untitled Album'}</h3>
                    <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-x-5 gap-y-1">
                      <span>Release Date: {formatDate(album.releaseDate)}</span>
                      <span>Users Liked: {formatNumber(album.uniqueUserLikes || 0)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                    <div className="text-center min-w-[110px]">
                      <p className="font-semibold text-lg text-gray-900">{formatNumber(album.likesCount || 0)}</p>
                      <p className="uppercase tracking-wide text-xs text-gray-500">Total Likes</p>
                    </div>
                    <div className="text-center min-w-[130px]">
                      <p className="font-semibold text-lg text-gray-900">{formatTime(Number(album.totalListeningDuration || 0))}</p>
                      <p className="uppercase tracking-wide text-xs text-gray-500 whitespace-nowrap">Listen Time</p>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-4">
                  <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Songs in this Album
                  </h5>
                  {songs.length === 0 ? (
                    <div className="border border-dashed border-gray-300 rounded-md px-3 py-4 text-center text-sm text-gray-500">
                      No songs found for this album during the selected period.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                        <thead className="bg-white">
                          <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <th className="px-3.5 py-2.5 text-left">Song Title</th>
                            <th className="px-3.5 py-2.5 text-left">Length</th>
          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {songs.map((song: any, songIdx: number) => (
                            <tr
                              key={`${album.albumId ?? idx}-song-${song.songId ?? songIdx}`}
                              className={songIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                            >
                              <td className="px-3.5 py-2.5 text-sm text-gray-900">{song.songName || 'Unknown Song'}</td>
                              <td className="px-3.5 py-2.5 text-sm text-gray-900">{formatTime(Number(song.duration || 0))}</td>
                            </tr>
                          ))}
      </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    );
  };

  const renderIndividualListenerPlaylistActivity = () => {
    const userType = reportData.userDetails?.userType;
    if (userType !== 'Listener') {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          Playlist activity is only available for listener accounts.
        </div>
      );
    }

    const allPlaylists = Array.isArray(reportData.listenerPlaylistActivity)
      ? [...reportData.listenerPlaylistActivity]
      : [];

    // Separate playlists into created and liked
    const createdPlaylists = allPlaylists.filter((playlist: any) => !playlist.isLikedByUser);
    const likedPlaylists = allPlaylists.filter((playlist: any) => playlist.isLikedByUser);

    // Helper function to parse time to seconds (HH:MM:SS format)
    const parseTimeToSeconds = (timeStr: string): number => {
      if (!timeStr || !timeStr.trim()) return 0;
      const digitsOnly = timeStr.trim().replace(/\D/g, '');
      if (digitsOnly.length === 0) return 0;
      const padded = digitsOnly.padStart(6, '0');
      const hours = parseInt(padded.substring(0, 2), 10) || 0;
      const minutes = parseInt(padded.substring(2, 4), 10) || 0;
      const seconds = parseInt(padded.substring(4, 6), 10) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    };

    // Apply filters to created playlists
    const filteredPlaylists = createdPlaylists.filter((playlist: any) => {
      // Playlist type filter
      if (individualListenerPlaylistFilters.playlistType === 'Public' && !playlist.isPublic) {
        return false;
      }
      if (individualListenerPlaylistFilters.playlistType === 'Private' && playlist.isPublic) {
        return false;
      }

      // Songs Under filter
      if (individualListenerPlaylistFilters.songsUnder) {
        const threshold = Number(individualListenerPlaylistFilters.songsUnder);
        const songCount = Number(playlist.songCount || 0);
        if (!Number.isNaN(threshold) && songCount >= threshold) {
          return false;
        }
      }

      // Songs Over filter
      if (individualListenerPlaylistFilters.songsOver) {
        const threshold = Number(individualListenerPlaylistFilters.songsOver);
        const songCount = Number(playlist.songCount || 0);
        if (!Number.isNaN(threshold) && songCount <= threshold) {
          return false;
        }
      }

      // Total Duration Under filter
      if (individualListenerPlaylistFilters.totalDurationUnder) {
        const thresholdSeconds = parseTimeToSeconds(individualListenerPlaylistFilters.totalDurationUnder);
        const totalDurationSeconds = Number(playlist.totalDuration || 0);
        if (thresholdSeconds > 0 && totalDurationSeconds >= thresholdSeconds) {
          return false;
        }
      }

      // Total Duration Over filter
      if (individualListenerPlaylistFilters.totalDurationOver) {
        const thresholdSeconds = parseTimeToSeconds(individualListenerPlaylistFilters.totalDurationOver);
        const totalDurationSeconds = Number(playlist.totalDuration || 0);
        if (thresholdSeconds > 0 && totalDurationSeconds <= thresholdSeconds) {
          return false;
        }
      }

      // Likes Under filter
      if (individualListenerPlaylistFilters.likesUnder) {
        const threshold = Number(individualListenerPlaylistFilters.likesUnder);
        const likes = Number(playlist.likes || 0);
        if (!Number.isNaN(threshold) && likes >= threshold) {
          return false;
        }
      }

      // Likes Over filter
      if (individualListenerPlaylistFilters.likesOver) {
        const threshold = Number(individualListenerPlaylistFilters.likesOver);
        const likes = Number(playlist.likes || 0);
        if (!Number.isNaN(threshold) && likes <= threshold) {
          return false;
        }
      }

      return true;
    });

    // Sort filtered playlists
    const sortedPlaylists = [...filteredPlaylists].sort((a: any, b: any) => {
      const sortOption = individualListenerPlaylistActivitySort;
      let comparison = 0;

      if (sortOption === 'playlistName-asc') {
        comparison = (a?.playlistName || '').toLowerCase().localeCompare((b?.playlistName || '').toLowerCase());
      } else if (sortOption === 'playlistName-desc') {
        comparison = (b?.playlistName || '').toLowerCase().localeCompare((a?.playlistName || '').toLowerCase());
      } else if (sortOption === 'dateCreated-asc') {
        const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = dateA - dateB;
      } else if (sortOption === 'dateCreated-desc') {
        const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = dateB - dateA;
      } else if (sortOption === 'numberOfSongs-asc') {
        comparison = Number(a?.songCount || 0) - Number(b?.songCount || 0);
      } else if (sortOption === 'numberOfSongs-desc') {
        comparison = Number(b?.songCount || 0) - Number(a?.songCount || 0);
      } else if (sortOption === 'totalDuration-asc') {
        comparison = Number(a?.totalDuration || 0) - Number(b?.totalDuration || 0);
      } else if (sortOption === 'totalDuration-desc') {
        comparison = Number(b?.totalDuration || 0) - Number(a?.totalDuration || 0);
      } else if (sortOption === 'likes-asc') {
        comparison = Number(a?.likes || 0) - Number(b?.likes || 0);
      } else if (sortOption === 'likes-desc') {
        comparison = Number(b?.likes || 0) - Number(a?.likes || 0);
      }

      return comparison;
    });

    if (allPlaylists.length === 0) {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          No playlist activity recorded for the selected period.
        </div>
      );
    }

    return (
      <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Playlist Activity</h3>
              <p className="text-xs text-gray-600">Playlists created by this listener and their engagement</p>
            </div>
            <button
              type="button"
              onClick={() => setShowIndividualPlaylistFilters(!showIndividualPlaylistFilters)}
              className="px-3 py-1 text-xs font-semibold rounded-full border border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              {showIndividualPlaylistFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Filters */}
          {showIndividualPlaylistFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Filters</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {/* Playlist Type Filter */}
                <div>
                  <label htmlFor="filter-playlist-type" className="block text-xs font-medium text-gray-600 mb-1">
                    Playlist Type
                  </label>
                  <select
                    id="filter-playlist-type"
                    value={individualListenerPlaylistFilters.playlistType}
                    onChange={(e) => {
                      setIndividualListenerPlaylistFilters((prev) => ({ 
                        ...prev, 
                        playlistType: e.target.value as 'Public' | 'Private' | 'All'
                      }));
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="All">All</option>
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                  </select>
                </div>

                {/* Songs Under */}
                <div>
                  <label htmlFor="filter-playlist-songs-under" className="block text-xs font-medium text-gray-600 mb-1">
                    Songs Under:
                  </label>
                  <input
                    type="number"
                    id="filter-playlist-songs-under"
                    min="0"
                    value={individualListenerPlaylistFilters.songsUnder}
                    onChange={(e) => {
                      setIndividualListenerPlaylistFilters((prev) => ({ ...prev, songsUnder: e.target.value }));
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter number"
                  />
                </div>

                {/* Songs Over */}
                <div>
                  <label htmlFor="filter-playlist-songs-over" className="block text-xs font-medium text-gray-600 mb-1">
                    Songs Over:
                  </label>
                  <input
                    type="number"
                    id="filter-playlist-songs-over"
                    min="0"
                    value={individualListenerPlaylistFilters.songsOver}
                    onChange={(e) => {
                      setIndividualListenerPlaylistFilters((prev) => ({ ...prev, songsOver: e.target.value }));
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter number"
                  />
                </div>

                {/* Total Duration Under */}
                <div>
                  <label htmlFor="filter-playlist-duration-under" className="block text-xs font-medium text-gray-600 mb-1">
                    Total Duration Under:
                  </label>
                  <input
                    type="text"
                    id="filter-playlist-duration-under"
                    value={(() => {
                      const raw = individualListenerPlaylistFilters.totalDurationUnder;
                      if (!raw) return '';
                      if (raw.length <= 2) {
                        return raw;
                      } else if (raw.length <= 4) {
                        const hh = raw.substring(0, 2);
                        const mm = raw.substring(2);
                        return `${hh}:${mm}`;
                      } else {
                        const hh = raw.substring(0, 2);
                        const mm = raw.substring(2, 4);
                        const ss = raw.substring(4);
                        return `${hh}:${mm}:${ss}`;
                      }
                    })()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setIndividualListenerPlaylistFilters((prev) => ({ ...prev, totalDurationUnder: raw }));
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="HH:MM:SS"
                    maxLength={8}
                  />
                </div>

                {/* Total Duration Over */}
                <div>
                  <label htmlFor="filter-playlist-duration-over" className="block text-xs font-medium text-gray-600 mb-1">
                    Total Duration Over:
                  </label>
                  <input
                    type="text"
                    id="filter-playlist-duration-over"
                    value={(() => {
                      const raw = individualListenerPlaylistFilters.totalDurationOver;
                      if (!raw) return '';
                      if (raw.length <= 2) {
                        return raw;
                      } else if (raw.length <= 4) {
                        const hh = raw.substring(0, 2);
                        const mm = raw.substring(2);
                        return `${hh}:${mm}`;
                      } else {
                        const hh = raw.substring(0, 2);
                        const mm = raw.substring(2, 4);
                        const ss = raw.substring(4);
                        return `${hh}:${mm}:${ss}`;
                      }
                    })()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setIndividualListenerPlaylistFilters((prev) => ({ ...prev, totalDurationOver: raw }));
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="HH:MM:SS"
                    maxLength={8}
                  />
                </div>

                {/* Likes Under */}
                <div>
                  <label htmlFor="filter-playlist-likes-under" className="block text-xs font-medium text-gray-600 mb-1">
                    Likes Under:
                  </label>
                  <input
                    type="number"
                    id="filter-playlist-likes-under"
                    min="0"
                    value={individualListenerPlaylistFilters.likesUnder}
                    onChange={(e) => {
                      setIndividualListenerPlaylistFilters((prev) => ({ ...prev, likesUnder: e.target.value }));
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter number"
                  />
                </div>

                {/* Likes Over */}
                <div>
                  <label htmlFor="filter-playlist-likes-over" className="block text-xs font-medium text-gray-600 mb-1">
                    Likes Over:
                  </label>
                  <input
                    type="number"
                    id="filter-playlist-likes-over"
                    min="0"
                    value={individualListenerPlaylistFilters.likesOver}
                    onChange={(e) => {
                      setIndividualListenerPlaylistFilters((prev) => ({ ...prev, likesOver: e.target.value }));
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter number"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sort Dropdown */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-5 py-3">
            <div className="flex items-center gap-3">
              <label htmlFor="sort-individual-listener-playlist-activity" className="text-xs font-medium text-gray-600 whitespace-nowrap">
                Sort by:
              </label>
              <select
                id="sort-individual-listener-playlist-activity"
                value={individualListenerPlaylistActivitySort}
                onChange={(e) => {
                  setIndividualListenerPlaylistActivitySort(e.target.value);
                }}
                className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="playlistName-asc">Playlist Name (A-Z)</option>
                <option value="playlistName-desc">Playlist Name (Z-A)</option>
                <option value="dateCreated-asc">Date Created (Oldest First)</option>
                <option value="dateCreated-desc">Date Created (Newest First)</option>
                <option value="numberOfSongs-asc">Number of Songs (Lowest to Highest)</option>
                <option value="numberOfSongs-desc">Number of Songs (Highest to Lowest)</option>
                <option value="totalDuration-asc">Total Duration (Shortest to Longest)</option>
                <option value="totalDuration-desc">Total Duration (Longest to Shortest)</option>
                <option value="likes-asc">Likes (Lowest to Highest)</option>
                <option value="likes-desc">Likes (Highest to Lowest)</option>
              </select>
            </div>
          </div>

          {sortedPlaylists.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg px-5 py-10 text-center text-sm text-gray-500">
              {createdPlaylists.length === 0
                ? 'No playlists created during the selected period.'
                : 'No playlists match the selected filters.'}
            </div>
          ) : (
            sortedPlaylists.map((playlist: any, idx: number) => {
            const allSongs = Array.isArray(playlist.songs) ? playlist.songs : [];
            const allLikedBy = Array.isArray(playlist.likedBy) ? playlist.likedBy : [];
            const playlistKey = `playlist-${playlist.playlistId ?? idx}`;
            const currentPlaylistState = expandedPlaylistSections[playlistKey] ?? { songs: false, liked: false };
            const songsExpanded = currentPlaylistState.songs;
            const likedExpanded = currentPlaylistState.liked;
            
            // Sort songs
            const songsSortOption = playlistSongsSortOptions[playlistKey] || 'songName-asc';
            const sortedSongs = [...allSongs].sort((a: any, b: any) => {
              let comparison = 0;
              if (songsSortOption === 'songName-asc') {
                comparison = (a?.songName || '').toLowerCase().localeCompare((b?.songName || '').toLowerCase());
              } else if (songsSortOption === 'songName-desc') {
                comparison = (b?.songName || '').toLowerCase().localeCompare((a?.songName || '').toLowerCase());
              } else if (songsSortOption === 'artistName-asc') {
                const artistA = (a?.artistUsername || '').toLowerCase();
                const artistB = (b?.artistUsername || '').toLowerCase();
                comparison = artistA.localeCompare(artistB);
              } else if (songsSortOption === 'artistName-desc') {
                const artistA = (a?.artistUsername || '').toLowerCase();
                const artistB = (b?.artistUsername || '').toLowerCase();
                comparison = artistB.localeCompare(artistA);
              } else if (songsSortOption === 'albumName-asc') {
                comparison = (a?.albumName || '').toLowerCase().localeCompare((b?.albumName || '').toLowerCase());
              } else if (songsSortOption === 'albumName-desc') {
                comparison = (b?.albumName || '').toLowerCase().localeCompare((a?.albumName || '').toLowerCase());
              } else if (songsSortOption === 'dateAdded-asc') {
                const dateA = a?.addedAt ? new Date(a.addedAt).getTime() : 0;
                const dateB = b?.addedAt ? new Date(b.addedAt).getTime() : 0;
                comparison = dateA - dateB;
              } else if (songsSortOption === 'dateAdded-desc') {
                const dateA = a?.addedAt ? new Date(a.addedAt).getTime() : 0;
                const dateB = b?.addedAt ? new Date(b.addedAt).getTime() : 0;
                comparison = dateB - dateA;
              }
              return comparison;
            });

            // Sort liked users
            const likedUsersSortOption = playlistLikedUsersSortOptions[playlistKey] || 'username-asc';
            const sortedLikedBy = [...allLikedBy].sort((a: any, b: any) => {
              let comparison = 0;
              if (likedUsersSortOption === 'username-asc') {
                comparison = (a?.username || '').toLowerCase().localeCompare((b?.username || '').toLowerCase());
              } else if (likedUsersSortOption === 'username-desc') {
                comparison = (b?.username || '').toLowerCase().localeCompare((a?.username || '').toLowerCase());
              } else if (likedUsersSortOption === 'dateLiked-asc') {
                const dateA = a?.likedAt ? new Date(a.likedAt).getTime() : 0;
                const dateB = b?.likedAt ? new Date(b.likedAt).getTime() : 0;
                comparison = dateA - dateB;
              } else if (likedUsersSortOption === 'dateLiked-desc') {
                const dateA = a?.likedAt ? new Date(a.likedAt).getTime() : 0;
                const dateB = b?.likedAt ? new Date(b.likedAt).getTime() : 0;
                comparison = dateB - dateA;
              }
              return comparison;
            });
            
            const togglePlaylistSection = (section: 'songs' | 'liked') => {
              setExpandedPlaylistSections((prev) => {
                const prior = prev[playlistKey] ?? { songs: false, liked: false };
                return {
                  ...prev,
                  [playlistKey]: {
                    ...prior,
                    [section]: !prior[section]
                  }
                };
              });
            };

            return (
              <section
                key={`${playlist.playlistId ?? idx}`}
                className="report-section bg-white border border-gray-200 rounded-lg shadow-sm space-y-4"
              >
                <div className="bg-gray-100 px-5 py-3.5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{playlist.playlistName || 'Untitled Playlist'}</h3>
                    <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-x-5 gap-y-1">
                      <span>Status: {playlist.isPublic ? 'Public' : 'Private'}</span>
                      <span>Created On: {formatDate(playlist.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                    <div className="text-center min-w-[110px]">
                      <p className="font-semibold text-lg text-gray-900">{formatNumber(playlist.songCount || 0)}</p>
                      <p className="uppercase tracking-wide text-xs text-gray-500">Songs</p>
                    </div>
                    <div className="text-center min-w-[130px]">
                      <p className="font-semibold text-lg text-gray-900">{formatTime(Number(playlist.totalDuration || 0))}</p>
                      <p className="uppercase tracking-wide text-xs text-gray-500 whitespace-nowrap">Total Duration</p>
                    </div>
                    <div className="text-center min-w-[110px]">
                      <p className="font-semibold text-lg text-gray-900">{formatNumber(playlist.likes || 0)}</p>
                      <p className="uppercase tracking-wide text-xs text-gray-500">Likes</p>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Songs in this Playlist
                      </h5>
                      <div className="flex items-center gap-3">
                        {sortedSongs.length > 0 && (
                          <>
                            <label htmlFor={`sort-songs-${playlistKey}`} className="text-xs font-medium text-gray-600 whitespace-nowrap">
                              Sort by:
                            </label>
                            <select
                              id={`sort-songs-${playlistKey}`}
                              value={songsSortOption}
                              onChange={(e) => {
                                setPlaylistSongsSortOptions((prev) => ({
                                  ...prev,
                                  [playlistKey]: e.target.value
                                }));
                              }}
                              className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            >
                              <option value="songName-asc">Song Name (A-Z)</option>
                              <option value="songName-desc">Song Name (Z-A)</option>
                              <option value="artistName-asc">Artist Name (A-Z)</option>
                              <option value="artistName-desc">Artist Name (Z-A)</option>
                              <option value="albumName-asc">Album Name (A-Z)</option>
                              <option value="albumName-desc">Album Name (Z-A)</option>
                              <option value="dateAdded-asc">Date Added (Oldest First)</option>
                              <option value="dateAdded-desc">Date Added (Newest First)</option>
                            </select>
                          </>
                        )}
                        {sortedSongs.length > 0 && (
                          <button
                            type="button"
                            onClick={() => togglePlaylistSection('songs')}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                            aria-expanded={songsExpanded}
                          >
                            {songsExpanded ? 'Hide songs' : 'Show songs'}
                          </button>
                        )}
                      </div>
                    </div>
                    {sortedSongs.length === 0 ? (
                      <div className="border border-dashed border-gray-300 rounded-md px-3 py-4 text-center text-sm text-gray-500">
                        No songs were added to this playlist during the selected period.
                      </div>
                    ) : songsExpanded ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                          <thead className="bg-gray-50">
                            <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              <th className="px-3.5 py-2.5 text-left">Song Name</th>
                              <th className="px-3.5 py-2.5 text-left">Artist</th>
                              <th className="px-3.5 py-2.5 text-left">Album</th>
                              <th className="px-3.5 py-2.5 text-left">Added On</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {sortedSongs.map((song: any, songIdx: number) => (
                              <tr
                                key={`${playlist.playlistId ?? idx}-song-${song.songId ?? songIdx}`}
                                className={songIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                              >
                                <td className="px-3.5 py-2.5 text-sm text-gray-900">{song.songName || 'Unknown Song'}</td>
                                <td className="px-3.5 py-2.5 text-sm text-gray-900">{song.artistUsername || 'Unknown Artist'}</td>
                                <td className="px-3.5 py-2.5 text-sm text-gray-700">{song.albumName || 'N/A'}</td>
                                <td className="px-3.5 py-2.5 text-sm text-gray-900">{formatDate(song.addedAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Click "Show songs" to reveal the list.
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Users Who Liked This Playlist
                      </h5>
                      <div className="flex items-center gap-3">
                        {sortedLikedBy.length > 0 && (
                          <>
                            <label htmlFor={`sort-liked-users-${playlistKey}`} className="text-xs font-medium text-gray-600 whitespace-nowrap">
                              Sort by:
                            </label>
                            <select
                              id={`sort-liked-users-${playlistKey}`}
                              value={likedUsersSortOption}
                              onChange={(e) => {
                                setPlaylistLikedUsersSortOptions((prev) => ({
                                  ...prev,
                                  [playlistKey]: e.target.value
                                }));
                              }}
                              className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            >
                              <option value="username-asc">Username (A-Z)</option>
                              <option value="username-desc">Username (Z-A)</option>
                              <option value="dateLiked-asc">Date Liked (Oldest First)</option>
                              <option value="dateLiked-desc">Date Liked (Newest First)</option>
                            </select>
                          </>
                        )}
                        {sortedLikedBy.length > 0 && (
                          <button
                            type="button"
                            onClick={() => togglePlaylistSection('liked')}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                            aria-expanded={likedExpanded}
                          >
                            {likedExpanded ? 'Hide users' : 'Show users'}
                          </button>
                        )}
                      </div>
                    </div>
                    {sortedLikedBy.length === 0 ? (
                      <div className="border border-dashed border-gray-300 rounded-md px-3 py-4 text-center text-sm text-gray-500">
                        No likes were recorded for this playlist during the selected period.
                      </div>
                    ) : likedExpanded ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                          <thead className="bg-gray-50">
                            <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              <th className="px-3.5 py-2.5 text-left">Username</th>
                              <th className="px-3.5 py-2.5 text-left">Liked On</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {sortedLikedBy.map((user: any, likeIdx: number) => (
                              <tr
                                key={`${playlist.playlistId ?? idx}-liked-${user.userId ?? likeIdx}`}
                                className={likeIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                              >
                                <td className="px-3.5 py-2.5 text-sm text-gray-900">{user.username || 'Unknown'}</td>
                                <td className="px-3.5 py-2.5 text-sm text-gray-900">{formatDate(user.likedAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Click "Show users" to reveal the list.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
            })
          )}
        </div>

        {/* Liked Playlists Section */}
        {likedPlaylists.length > 0 && (
          <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm mt-4">
            <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
              <h3 className="text-lg font-semibold text-gray-800">Liked Playlists</h3>
              <p className="text-xs text-gray-600">Playlists this listener has liked</p>
            </div>
            <div className="px-5 py-4 space-y-4">
              {likedPlaylists.map((playlist: any, idx: number) => {
                const songs = Array.isArray(playlist.songs) ? playlist.songs : [];
                const playlistKey = `liked-playlist-${playlist.playlistId ?? idx}`;
                const currentPlaylistState = expandedPlaylistSections[playlistKey] ?? { songs: false, liked: false };
                const songsExpanded = currentPlaylistState.songs;
                
                const togglePlaylistSection = (section: 'songs' | 'liked') => {
                  setExpandedPlaylistSections((prev) => {
                    const prior = prev[playlistKey] ?? { songs: false, liked: false };
                    return {
                      ...prev,
                      [playlistKey]: {
                        ...prior,
                        [section]: !prior[section]
                      }
                    };
                  });
                };

                return (
                  <section
                    key={`liked-${playlist.playlistId ?? idx}`}
                    className="report-section bg-white border border-gray-200 rounded-lg shadow-sm space-y-4"
                  >
                    <div className="bg-gray-100 px-5 py-3.5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{playlist.playlistName || 'Untitled Playlist'}</h3>
                        <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-x-5 gap-y-1">
                          <span>Status: {playlist.isPublic ? 'Public' : 'Private'}</span>
                          <span>Created On: {formatDate(playlist.createdAt)}</span>
                          <span>Liked On: {formatDate(playlist.likedAt)}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                        <div className="text-center min-w-[110px]">
                          <p className="font-semibold text-lg text-gray-900">{formatNumber(playlist.songCount || 0)}</p>
                          <p className="uppercase tracking-wide text-xs text-gray-500">Songs</p>
                        </div>
                        <div className="text-center min-w-[130px]">
                          <p className="font-semibold text-lg text-gray-900">{formatTime(Number(playlist.totalDuration || 0))}</p>
                          <p className="uppercase tracking-wide text-xs text-gray-500 whitespace-nowrap">Total Duration</p>
                        </div>
                        <div className="text-center min-w-[110px]">
                          <p className="font-semibold text-lg text-gray-900">{formatNumber(playlist.likes || 0)}</p>
                          <p className="uppercase tracking-wide text-xs text-gray-500">Likes</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 pb-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Songs in this Playlist
                        </h5>
                        {songs.length > 0 && (
                          <button
                            type="button"
                            onClick={() => togglePlaylistSection('songs')}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                            aria-expanded={songsExpanded}
                          >
                            {songsExpanded ? 'Hide songs' : 'Show songs'}
                          </button>
                        )}
                      </div>
                      {songs.length === 0 ? (
                        <div className="border border-dashed border-gray-300 rounded-md px-3 py-4 text-center text-sm text-gray-500">
                          No songs were added to this playlist during the selected period.
                        </div>
                      ) : songsExpanded ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                            <thead className="bg-gray-50">
                              <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <th className="px-3.5 py-2.5 text-left">Song Name</th>
                                <th className="px-3.5 py-2.5 text-left">Artist</th>
                                <th className="px-3.5 py-2.5 text-left">Album</th>
                                <th className="px-3.5 py-2.5 text-left">Added On</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {songs.map((song: any, songIdx: number) => (
                                <tr
                                  key={`liked-${playlist.playlistId ?? idx}-song-${song.songId ?? songIdx}`}
                                  className={songIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                                >
                                  <td className="px-3.5 py-2.5 text-sm text-gray-900">{song.songName || 'Unknown Song'}</td>
                                  <td className="px-3.5 py-2.5 text-sm text-gray-900">{song.artistUsername || 'Unknown Artist'}</td>
                                  <td className="px-3.5 py-2.5 text-sm text-gray-700">{song.albumName || 'N/A'}</td>
                                  <td className="px-3.5 py-2.5 text-sm text-gray-900">{formatDate(song.addedAt)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Click "Show songs" to reveal the list.
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="analytics-report-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="analytics-report-modal bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="print-header bg-red-600 text-white px-6 py-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:bg-white print:text-black print:border-b print:border-gray-300">
          <div>
            <h2 className="text-3xl font-bold">Analytics Report</h2>
            <p className="text-red-100 mt-1 print:text-gray-600">
              {isIndividualUser ? 'Individual User Analytics' : 'User Engagement & Content Analytics'}
            </p>
            {reportingRange && (
              <p className="text-xs text-red-100 mt-2 print:text-gray-500">
                Reporting Period: {reportingRange}
              </p>
            )}
            {generatedAt && (
              <p className="text-xs text-red-100 print:text-gray-500">
                Generated {generatedAt}
              </p>
            )}
          </div>
          <div className="flex gap-3 self-end sm:self-auto">
          <button
            onClick={onClose}
              className="px-4 py-2 bg-red-700 text-white font-semibold rounded-lg shadow-sm hover:bg-red-800 transition-colors"
          >
              Close
          </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 analytics-report-printable space-y-6">
          <div className={getPageClass('summary', true)}>
            {renderSummaryView()}
          </div>
          {!isIndividualUser && (
            <div className={getPageClass('userReport')}>
              {renderUserActivityView()}
            </div>
          )}
          {availableArtistActivity && (
            <div className={getPageClass('artistActivity')}>
              {renderArtistActivity()}
            </div>
          )}
          {availablePlaylistActivity && (
            <div className={getPageClass('playlistActivity')}>
              {renderPlaylistActivity()}
            </div>
          )}
          {availableAlbumActivity && (
            <div className={getPageClass('albumActivity')}>
              {renderAlbumActivity()}
            </div>
          )}
          {showSongStats && (
            <div className={getPageClass('songActivity')}>
              {renderSongActivity()}
            </div>
          )}
          {!showSongStats && (
            <div
              className={`analytics-report-page hidden print-visible ${!isIndividualUser ? 'print-break-before' : ''} bg-white border border-dashed border-gray-300 rounded-lg px-5 py-8 text-center text-gray-500`}
            >
              Song activity reporting is disabled for this export.
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print-hidden">
          {isIndividualUser ? (
            <div className="flex items-center gap-3">
          <button
                onClick={() => setViewMode('summary')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  viewMode === 'summary'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                }`}
              >
                Overview
          </button>
              {availableSongActivity && (
                <button
                  onClick={() => setViewMode('songActivity')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    viewMode === 'songActivity'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                  }`}
                >
                  Song Activity
                </button>
              )}
              {availableArtistActivity && (
                <button
                  onClick={() => setViewMode('artistActivity')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    viewMode === 'artistActivity'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                  }`}
                >
                  Artist Activity
                </button>
              )}
              {availableAlbumActivity && (
                <button
                  onClick={() => setViewMode('albumActivity')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    viewMode === 'albumActivity'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                  }`}
                >
                  Album Activity
                </button>
              )}
              {availablePlaylistActivity && (
                <button
                  onClick={() => setViewMode('playlistActivity')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    viewMode === 'playlistActivity'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                  }`}
                >
                  Playlist Activity
                </button>
              )}
        </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('summary')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  viewMode === 'summary'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                }`}
              >
                Summary View
              </button>
              <button
                onClick={() => setViewMode('userReport')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  viewMode === 'userReport'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                }`}
              >
                User Activity
              </button>
              {showArtistStats && (
                <button
                  onClick={() => setViewMode('artistActivity')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    viewMode === 'artistActivity'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                  }`}
                >
                  Artist Activity
                </button>
              )}
              {availablePlaylistActivity && (
                <button
                  onClick={() => setViewMode('playlistActivity')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    viewMode === 'playlistActivity'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                  }`}
                >
                  Playlist Activity
                </button>
              )}
              {availableAlbumActivity && (
                <button
                  onClick={() => setViewMode('albumActivity')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    viewMode === 'albumActivity'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                  }`}
                >
                  Album Activity
                </button>
              )}
              {availableSongActivity && (
                <button
                  onClick={() => setViewMode('songActivity')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    viewMode === 'songActivity'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                  }`}
                >
                  Song Activity
                </button>
              )}
            </div>
          )}
          <span className="text-xs text-gray-500">
            Generated {generatedAt ?? new Date().toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
