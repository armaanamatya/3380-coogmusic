import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getFileUrl } from '../services/api';

const PRINT_STYLES = `
  @page {
    margin: 0.15in 0.2in 0.3in 0.2in;
  }

  @media print {
    body {
      background-color: #ffffff !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    body * {
      visibility: hidden;
    }
    .analytics-report-overlay,
    .analytics-report-overlay *,
    .analytics-report-printable,
    .analytics-report-printable * {
      visibility: visible;
    }
    .analytics-report-overlay {
      position: static !important;
      inset: auto !important;
      background: transparent !important;
      box-shadow: none !important;
      padding: 0 !important;
      width: auto !important;
      min-height: auto !important;
    }
    .analytics-report-modal {
      position: static !important;
      inset: auto !important;
      width: auto !important;
      max-width: 100% !important;
      max-height: none !important;
      box-shadow: none !important;
      background: #ffffff !important;
      border: none !important;
    }
    .analytics-report-printable {
      position: static !important;
      overflow: visible !important;
      max-height: none !important;
      padding: 0in 0.2in 0.2in 0.2in !important;
      background: #ffffff !important;
      color: #000000 !important;
      column-gap: 0 !important;
      font-size: 11px !important;
      line-height: 1.35 !important;
    }
    .analytics-report-section {
      width: 100% !important;
    }
    .analytics-report-section:first-of-type {
      margin-top: 0 !important;
    }
    .analytics-report-section .report-cover {
      margin-bottom: 0.12in !important;
      padding: 0.2in 0.18in 0.18in 0.18in !important;
    }
    .report-cover h2 {
      font-size: 18px !important;
    }
    .report-cover h3 {
      font-size: 11px !important;
    }
    .print-controls {
      display: none !important;
    }
    .print-hidden {
      display: none !important;
    }
    .print-visible {
      display: block !important;
    }
    .report-section {
      page-break-inside: auto;
      break-inside: auto;
      margin-bottom: 0.12in;
      overflow: visible !important;
      padding: 0.12in 0.16in !important;
    }
    .report-section table {
      width: 100% !important;
      table-layout: auto !important;
    }
    .report-section th,
    .report-section td {
      white-space: normal !important;
      overflow: visible !important;
      padding: 4px 6px !important;
      font-size: 10.5px !important;
    }
    .report-section.print-keep-together {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .report-section.print-keep-together table {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .report-section .overflow-x-auto {
      overflow: visible !important;
    }
    .analytics-report-page {
      page-break-after: auto;
      margin: 0 !important;
      padding: 0 !important;
    }
    .analytics-report-page > .report-cover:first-child,
    .analytics-report-page > .analytics-report-section:first-child,
    .analytics-report-page > .report-section:first-child {
      margin-top: 0 !important;
    }
    .print-break-before {
      page-break-before: always;
      break-before: page;
    }
    .print-header {
      padding: 0.05in 0.25in 0.18in 0.25in !important;
    }
  }
`;

const PAGE_SIZE = 20;
const ARTIST_PAGE_SIZE = 10;
const ALBUM_PAGE_SIZE = 10;
const PLAYLIST_PAGE_SIZE = 6;
const SONG_PAGE_SIZE = 10;

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
  const [expandedAlbumSections, setExpandedAlbumSections] = useState<Record<string, { songs: boolean; liked: boolean }>>({});
  const [expandedPlaylistSections, setExpandedPlaylistSections] = useState<
    Record<string, { songs: boolean; liked: boolean }>
  >({});

  const [paginationPages, setPaginationPages] = useState<Record<string, number>>({});

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

    const albums = [...reportData.albumActivity].sort((a: any, b: any) => {
      const artistA = (a?.artistUsername || '').toLowerCase();
      const artistB = (b?.artistUsername || '').toLowerCase();
      const artistComparison = artistB.localeCompare(artistA);
      if (artistComparison !== 0) return artistComparison;
      const dateA = a?.releaseDate ? new Date(a.releaseDate).getTime() : 0;
      const dateB = b?.releaseDate ? new Date(b.releaseDate).getTime() : 0;
      return dateB - dateA;
    });
    const { items: pagedAlbums, pageInfo: albumPageInfo } = getPaginatedList(
      albums,
      'albumActivity',
      ALBUM_PAGE_SIZE
    );

    return (
      <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-800">Album Activity</h3>
          <p className="text-xs text-gray-600">Performance details for albums released in the selected period</p>
        </div>
        <div className="px-5 py-4 space-y-4">
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
                    <span>Total Length: {formatTime(Number(album.totalDuration || 0))}</span>
                    <span>Songs: {formatNumber(album.songCount || 0)}</span>
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
                          {songs.map((song: any, songIdx: number) => (
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
                          {likedBy.map((user: any, likeIdx: number) => (
                            <tr
                              key={`${album.albumId ?? idx}-liked-${user.userId ?? likeIdx}`}
                              className={likeIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                            >
                              <td className="px-3.5 py-2.5 text-sm text-gray-900">{user.username || 'Unknown'}</td>
                              <td className="px-3.5 py-2.5 text-sm text-gray-900">
                                {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A'}
          </td>
                              <td className="px-3.5 py-2.5 text-sm text-gray-700 break-all">{user.email || 'N/A'}</td>
                              <td className="px-3.5 py-2.5 text-sm text-gray-900">{formatDate(user.likedAt)}</td>
        </tr>
                          ))}
                        </tbody>
                      </table>
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
        </div>
        <PaginationControls
          pageInfo={albumPageInfo}
          onPageChange={(page) => setPageForKey('albumActivity', page, albumPageInfo.pageCount)}
          className="mt-4 px-5"
        />
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
    const publicPlaylists: any[] = Array.isArray(playlistData.publicPlaylists)
      ? [...playlistData.publicPlaylists]
      : [];
    const privatePlaylists: any[] = Array.isArray(playlistData.privatePlaylists)
      ? [...playlistData.privatePlaylists]
      : [];

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

      const sorted = [...playlists].sort((a, b) => {
        const usernameA = (a.ownerUsername || '').toLowerCase();
        const usernameB = (b.ownerUsername || '').toLowerCase();
        return usernameA.localeCompare(usernameB);
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
                            {songs.map((song, songIdx) => (
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
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                            <thead className="bg-white">
                              <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <th className="px-3.5 py-2.5 text-left">Username</th>
                                <th className="px-3.5 py-2.5 text-left">Liked On</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {likedBy.map((user, likeIdx) => (
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
          <h3 className="text-lg font-semibold text-gray-800">Playlist Activity</h3>
          <p className="text-xs text-gray-600">Breakdown of public and private playlists during the reporting period</p>
        </div>
        <div className="px-5 py-4 space-y-6">
          {renderPlaylistSection(publicPlaylists, 'Public Playlists', true)}
          {renderPlaylistSection(privatePlaylists, 'Private Playlists', false)}
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
    const loginStats = reportData.loginStats || {};

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
      { label: 'City', value: details.city || 'N/A' },
      { label: 'Account Status', value: details.accountStatus || 'Active' }
    ];

    if (details.userType === 'Artist') {
      const verificationValue = details.verified
        ? `Verified${details.verificationDate ? ` on ${formatDate(details.verificationDate)}` : ''}`
        : 'Not Verified';
      infoItems.splice(7, 0, {
        label: 'Verification Status',
        value: verificationValue
      });
    }

    const statusNotice =
      details.accountStatus && details.accountStatus !== 'Active'
        ? `Status: ${details.accountStatus}${details.statusDate ? ` since ${formatDate(details.statusDate)}` : ''}`
        : null;

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

        {statusNotice && (
          <div className="text-sm font-semibold text-red-600">{statusNotice}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-center shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total Logins</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {formatNumber(loginStats?.totalLogins || 0)}
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-center shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total Login Time</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {formatTime(loginStats?.totalTimeLoggedIn || 0)}
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-center shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Average Session</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {formatTime(loginStats?.averageTimeLoggedIn || 0)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const styleId = 'analytics-report-print-styles';
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      styleTag.innerHTML = PRINT_STYLES;
      document.head.appendChild(styleTag);
    }
    const originalOverflow = document.body.style.overflow;
    return () => {
      document.body.style.overflow = originalOverflow;
      if (styleTag && styleTag.parentNode) {
        styleTag.parentNode.removeChild(styleTag);
      }
    };
  }, []);

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
    const songs = Array.isArray(reportData.listenerSongActivity)
      ? [...reportData.listenerSongActivity].sort((a: any, b: any) => {
          const artistA = (a?.artistUsername || '').toLowerCase();
          const artistB = (b?.artistUsername || '').toLowerCase();
          const artistComparison = artistB.localeCompare(artistA);
          if (artistComparison !== 0) return artistComparison;
          const nameA = (a?.songName || '').toLowerCase();
          const nameB = (b?.songName || '').toLowerCase();
          return nameB.localeCompare(nameA);
        })
      : [];

    const summaryCards = [
      { label: 'Total Songs Listened', value: formatNumber(summary.totalSongsListened || 0) },
      { label: 'Distinct Songs', value: formatNumber(summary.distinctSongsListened || 0) },
      { label: 'Songs Liked', value: formatNumber(summary.songsLiked || 0) },
      { label: 'Total Listen Duration', value: formatTime(summary.totalListeningDuration || 0) },
      { label: 'Average Listen Duration', value: formatTime(summary.averageListeningDuration || 0) }
    ];

    return (
      <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-800">Song Activity</h3>
          <p className="text-xs text-gray-600">Personal listening activity for this account</p>
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

          {songs.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg px-5 py-10 text-center text-sm text-gray-500">
              No song activity recorded for the selected period.
            </div>
          ) : (
            songs
              .sort((a: any, b: any) => (b.totalListens || 0) - (a.totalListens || 0))
              .map((song: any, idx: number) => {
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
                        <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                          Listen History
                        </h5>
                        {listenDetails.length === 0 ? (
                          <div className="border border-dashed border-gray-300 rounded-md px-3 py-4 text-center text-sm text-gray-500">
                            No detailed listens were recorded for this song during the selected period.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                              <thead className="bg-white">
                                <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  <th className="px-3.5 py-2.5 text-left">Played On</th>
                                  <th className="px-3.5 py-2.5 text-left">Listen Duration</th>
            </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {listenDetails.map((detail: any, listenIdx: number) => (
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

  const renderAggregateSongActivity = () => {
    if (!availableSongActivity) {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          No song activity recorded for the selected period.
        </div>
      );
    }

    const songs = [...reportData.songActivity].sort((a: any, b: any) => {
      const artistA = (a?.artistUsername || a?.artistName || '').toLowerCase();
      const artistB = (b?.artistUsername || b?.artistName || '').toLowerCase();
      const comparison = artistA.localeCompare(artistB);
      if (comparison !== 0) return comparison;
      return (a?.songName || '').toLowerCase().localeCompare((b?.songName || '').toLowerCase());
    });

    const { items: pagedSongs, pageInfo: songPageInfo } = getPaginatedList(
      songs,
      'songActivity',
      SONG_PAGE_SIZE
    );

    return (
      <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-800">Song Activity</h3>
          <p className="text-xs text-gray-600">Detailed engagement for songs played during the reporting period</p>
        </div>
        <div className="px-5 py-4 space-y-4">
          {pagedSongs.map((song: any, idx: number) => {
            const listenerDetails: any[] = Array.isArray(song.listenerDetails) ? song.listenerDetails : [];
            const songKey = `song-${song.songId ?? idx}`;
            const listenersExpanded = expandedSongListeners[songKey] ?? false;
            const toggleListeners = () => {
              setExpandedSongListeners((prev) => ({
                ...prev,
                [songKey]: !prev[songKey]
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
                    <div className="text-center">
                      <p className="font-semibold text-lg text-gray-900">
                        {formatNumber(Number(song.totalLikes ?? 0))}
                      </p>
                      <p className="uppercase tracking-wide text-xs text-gray-500">Total Likes</p>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Listeners</h5>
                    {listenerDetails.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleListeners}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        aria-expanded={listenersExpanded}
                      >
                        {listenersExpanded ? 'Hide listeners' : 'Show listeners'}
                      </button>
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
                            <th className="px-3.5 py-2.5 text-left">Liked?</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {listenerDetails.map((listener: any, listenerIdx: number) => (
                            <tr
                              key={`${song.songId ?? idx}-listener-${listenerIdx}`}
                              className={listenerIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                            >
                              <td className="px-3.5 py-2.5 text-sm text-gray-900">{listener.username || 'Unknown User'}</td>
                              <td className="px-3.5 py-2.5 text-sm text-gray-900 text-center">{formatNumber(listener.listenCount || 0)}</td>
                              <td className="px-3.5 py-2.5 text-sm text-gray-900">{listener.liked ? 'Liked' : 'Not Liked'}</td>
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
        </div>
        <PaginationControls
          pageInfo={songPageInfo}
          onPageChange={(page) => setPageForKey('songActivity', page, songPageInfo.pageCount)}
          className="mt-4 px-5"
        />
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

    const artists = [...reportData.artistActivity].sort((a: any, b: any) =>
      (a?.username || '').toLowerCase().localeCompare((b?.username || '').toLowerCase())
    );
    const { items: pagedArtists, pageInfo: artistPageInfo } = getPaginatedList(
      artists,
      'artistActivity',
      ARTIST_PAGE_SIZE
    );

    return (
      <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-800">Artist Activity</h3>
          <p className="text-xs text-gray-600">Key metrics for artists included in this report</p>
        </div>
        <div className="px-5 py-4 space-y-4">
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
                      const { items: pagedFollowers, pageInfo: followerPageInfo } = getPaginatedList(
                        followers,
                        followerPaginationKey,
                        20
                      );
                      return (
                        <>
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
        </div>
        <PaginationControls
          pageInfo={artistPageInfo}
          onPageChange={(page) => setPageForKey('artistActivity', page, artistPageInfo.pageCount)}
          className="mt-4"
        />
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
    
    const start = new Date(reportStartDate);
    const end = new Date(reportEndDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dailyCounts[dateKey] = { total: 0, listeners: 0, artists: 0 };
    }

    allUsers.forEach((user) => {
      const dateKey = new Date(user.dateJoined).toISOString().split('T')[0];
      if (dailyCounts[dateKey]) {
        dailyCounts[dateKey].total++;
        if (user.userType === 'Listener') {
          dailyCounts[dateKey].listeners++;
        } else if (user.userType === 'Artist') {
          dailyCounts[dateKey].artists++;
        }
      }
    });

    const sortedDates = Object.keys(dailyCounts).sort();
    
    // Calculate cumulative totals
    let cumulativeTotal = 0;
    let cumulativeListeners = 0;
    let cumulativeArtists = 0;
    
    const totalData = sortedDates.map((date) => {
      cumulativeTotal += dailyCounts[date].total;
      return cumulativeTotal;
    });
    
    const listenerData = sortedDates.map((date) => {
      cumulativeListeners += dailyCounts[date].listeners;
      return cumulativeListeners;
    });
    
    const artistData = sortedDates.map((date) => {
      cumulativeArtists += dailyCounts[date].artists;
      return cumulativeArtists;
    });

    const totalUsers = totalData[totalData.length - 1] || 0;
    const totalListeners = listenerData[listenerData.length - 1] || 0;
    const totalArtists = artistData[artistData.length - 1] || 0;

    // Remove intermediate points on flat lines, keeping only start and end of flat segments
    const removeFlatLinePoints = (dataArray: number[], datesArray: string[]): { data: number[]; dates: string[] } => {
      if (!dataArray || !datesArray || dataArray.length === 0 || datesArray.length === 0) {
        return { data: [], dates: [] };
      }
      
      if (dataArray.length <= 2) {
        return { data: dataArray, dates: datesArray };
      }
      
      const filteredData: number[] = [];
      const filteredDates: string[] = [];
      
      let i = 0;
      while (i < dataArray.length) {
        const currentValue = dataArray[i];
        const flatSegmentStart = i;
        
        // Check if we're starting a flat segment (same value as next point)
        if (i < dataArray.length - 1 && dataArray[i + 1] === currentValue) {
          // Find the end of the flat segment
          while (i < dataArray.length - 1 && dataArray[i + 1] === currentValue) {
            i++;
          }
          // We found a flat segment from flatSegmentStart to i
          // Include the start of the flat segment (only if it's the first point or different from previous)
          if (flatSegmentStart === 0 || (filteredData.length > 0 && filteredData[filteredData.length - 1] !== currentValue)) {
            filteredData.push(dataArray[flatSegmentStart]);
            filteredDates.push(datesArray[flatSegmentStart]);
          }
          // Include the end of the flat segment
          filteredData.push(dataArray[i]);
          filteredDates.push(datesArray[i]);
        } else {
          // Not part of a flat segment, include the point
          filteredData.push(dataArray[i]);
          filteredDates.push(datesArray[i]);
        }
        i++;
      }
      
      return { data: filteredData, dates: filteredDates };
    };

    // Sample data to 15-20 points for better performance and visual clarity
    const sampleData = <T,>(dataArray: T[], datesArray: string[], targetPoints: number = 18): { data: T[]; dates: string[] } => {
      if (!dataArray || !datesArray || dataArray.length === 0 || datesArray.length === 0) {
        return { data: [], dates: [] };
      }
      
      if (dataArray.length <= targetPoints) {
        return { data: dataArray, dates: datesArray };
      }
      
      const sampledData: T[] = [];
      const sampledDates: string[] = [];
      const step = (dataArray.length - 1) / (targetPoints - 1);
      
      for (let i = 0; i < targetPoints; i++) {
        const index = Math.min(Math.round(i * step), dataArray.length - 1);
        if (dataArray[index] !== undefined && datesArray[index]) {
          sampledData.push(dataArray[index]);
          sampledDates.push(datesArray[index]);
        }
      }
      
      // Ensure last point is always included
      if (sampledDates.length > 0 && sampledDates[sampledDates.length - 1] !== datesArray[datesArray.length - 1]) {
        sampledData[sampledData.length - 1] = dataArray[dataArray.length - 1];
        sampledDates[sampledDates.length - 1] = datesArray[datesArray.length - 1];
      }
      
      return { data: sampledData, dates: sampledDates };
    };

    const sampledTotal = sampleData(totalData, sortedDates);
    const sampledListeners = sampleData(listenerData, sortedDates);
    const sampledArtists = sampleData(artistData, sortedDates);

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
    
    // Convert to sorted array (dates should already be sorted, but ensure it)
    const unifiedDates = Array.from(allDatesSet).sort();
    
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
    const alignedTotalData: number[] = [];
    const alignedListenersData: number[] = [];
    const alignedArtistsData: number[] = [];
    
    let lastTotal = 0;
    let lastListeners = 0;
    let lastArtists = 0;
    
    unifiedDates.forEach((date) => {
      if (totalMap.has(date)) {
        lastTotal = totalMap.get(date)!;
      }
      alignedTotalData.push(lastTotal);
      
      if (listenersMap.has(date)) {
        lastListeners = listenersMap.get(date)!;
      }
      alignedListenersData.push(lastListeners);
      
      if (artistsMap.has(date)) {
        lastArtists = artistsMap.get(date)!;
      }
      alignedArtistsData.push(lastArtists);
    });

    return {
      total: { data: alignedTotalData, total: totalUsers },
      listeners: { data: alignedListenersData, total: totalListeners },
      artists: { data: alignedArtistsData, total: totalArtists },
      dateRange: { start: reportStartDate, end: reportEndDate },
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

    const reportStartDate = reportMeta.startDate ? new Date(reportMeta.startDate) : null;
    const reportEndDate = reportMeta.endDate ? new Date(reportMeta.endDate) : null;

    if (!reportStartDate || !reportEndDate || isNaN(reportStartDate.getTime()) || isNaN(reportEndDate.getTime())) {
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

    const start = new Date(reportStartDate);
    const end = new Date(reportEndDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dailyUploads[dateKey] = 0;
      dailyPlays[dateKey] = 0;
    }

    songsUploaded.forEach((song) => {
      const dateKey = new Date(song.releaseDate).toISOString().split('T')[0];
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

    // Calculate cumulative plays
    const sortedDates = Object.keys(dailyPlays).sort();
    let cumulativePlays = 0;
    sortedDates.forEach((date) => {
      cumulativePlays += dailyPlays[date];
      dailyPlays[date] = cumulativePlays;
    });

    const sortedUploadDates = Object.keys(dailyUploads).sort();

    // Calculate cumulative totals
    let cumulativeUploads = 0;
    const uploadData = sortedUploadDates.map((date) => {
      cumulativeUploads += dailyUploads[date];
      return cumulativeUploads;
    });

    const playData = sortedDates.map((date) => dailyPlays[date]);

    const totalUploads = uploadData[uploadData.length - 1] || 0;
    const totalPlays = playData[playData.length - 1] || 0;

    // Use the same helper functions from userCreationSparklines
    const removeFlatLinePoints = (dataArray: number[], datesArray: string[]): { data: number[]; dates: string[] } => {
      if (!dataArray || !datesArray || dataArray.length === 0 || datesArray.length === 0) {
        return { data: [], dates: [] };
      }
      
      if (dataArray.length <= 2) {
        return { data: dataArray, dates: datesArray };
      }
      
      const filteredData: number[] = [];
      const filteredDates: string[] = [];
      
      let i = 0;
      while (i < dataArray.length) {
        const currentValue = dataArray[i];
        const flatSegmentStart = i;
        
        if (i < dataArray.length - 1 && dataArray[i + 1] === currentValue) {
          while (i < dataArray.length - 1 && dataArray[i + 1] === currentValue) {
            i++;
          }
          if (flatSegmentStart === 0 || (filteredData.length > 0 && filteredData[filteredData.length - 1] !== currentValue)) {
            filteredData.push(dataArray[flatSegmentStart]);
            filteredDates.push(datesArray[flatSegmentStart]);
          }
          filteredData.push(dataArray[i]);
          filteredDates.push(datesArray[i]);
        } else {
          filteredData.push(dataArray[i]);
          filteredDates.push(datesArray[i]);
        }
        i++;
      }
      
      return { data: filteredData, dates: filteredDates };
    };

    const sampleData = <T,>(dataArray: T[], datesArray: string[], targetPoints: number = 18): { data: T[]; dates: string[] } => {
      if (!dataArray || !datesArray || dataArray.length === 0 || datesArray.length === 0) {
        return { data: [], dates: [] };
      }
      
      if (dataArray.length <= targetPoints) {
        return { data: dataArray, dates: datesArray };
      }
      
      const sampledData: T[] = [];
      const sampledDates: string[] = [];
      const step = (dataArray.length - 1) / (targetPoints - 1);
      
      for (let i = 0; i < targetPoints; i++) {
        const index = Math.min(Math.round(i * step), dataArray.length - 1);
        if (dataArray[index] !== undefined && datesArray[index]) {
          sampledData.push(dataArray[index]);
          sampledDates.push(datesArray[index]);
        }
      }
      
      if (sampledDates.length > 0 && sampledDates[sampledDates.length - 1] !== datesArray[datesArray.length - 1]) {
        sampledData[sampledData.length - 1] = dataArray[dataArray.length - 1];
        sampledDates[sampledDates.length - 1] = datesArray[datesArray.length - 1];
      }
      
      return { data: sampledData, dates: sampledDates };
    };

    const sampledUploads = sampleData(uploadData, sortedUploadDates);
    const sampledPlays = sampleData(playData, sortedDates);

    const filteredUploads = removeFlatLinePoints(sampledUploads.data as number[], sampledUploads.dates);
    const filteredPlays = removeFlatLinePoints(sampledPlays.data as number[], sampledPlays.dates);

    const allDatesSet = new Set<string>();
    filteredUploads.dates.forEach(date => allDatesSet.add(date));
    filteredPlays.dates.forEach(date => allDatesSet.add(date));
    
    const unifiedDates = Array.from(allDatesSet).sort();
    
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
    
    unifiedDates.forEach((date) => {
      if (uploadsMap.has(date)) {
        lastUploads = uploadsMap.get(date)!;
      }
      alignedUploadsData.push(lastUploads);
      
      if (playsMap.has(date)) {
        lastPlays = playsMap.get(date)!;
      }
      alignedPlaysData.push(lastPlays);
    });

    return {
      uploaded: { data: alignedUploadsData, total: totalUploads },
      played: { data: alignedPlaysData, total: totalPlays },
      dateRange: { start: reportStartDate, end: reportEndDate },
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
      return true;
    });
    const { items: pagedListeners, pageInfo: listenerPageInfo } = getPaginatedList(
      filteredListeners,
      'userActivity-listeners'
    );
    const { items: pagedArtists, pageInfo: artistPageInfo } = getPaginatedList(
      filteredArtists,
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
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-3">
                <label className="flex flex-col gap-1 text-[11px]">
                  Date of Birth Start
                  <input
                    type="date"
                    value={listenerDobRange.start}
                    onChange={(event) =>
                      setListenerDobRange((prev) => ({ ...prev, start: event.target.value }))
                    }
                    className="rounded border border-gray-300 px-2 py-1 text-[11px]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px]">
                  Date of Birth End
                  <input
                    type="date"
                    value={listenerDobRange.end}
                    onChange={(event) =>
                      setListenerDobRange((prev) => ({ ...prev, end: event.target.value }))
                    }
                    className="rounded border border-gray-300 px-2 py-1 text-[11px]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px]">
                  Country
                  <select
                    value={listenerCountryFilter}
                    onChange={(event) => {
                      setListenerCountryFilter(event.target.value);
                      setListenerCityFilter('All Cities'); // Reset city when country changes
                    }}
                    className="rounded border border-gray-300 px-2 py-1 text-[11px]"
                  >
                    <option value="All Countries">All Countries</option>
                    {listenerCountries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[11px]">
                  City
                  <select
                    value={listenerCityFilter}
                    onChange={(event) => setListenerCityFilter(event.target.value)}
                    className="rounded border border-gray-300 px-2 py-1 text-[11px]"
                    disabled={listenerCountryFilter === 'All Countries' && listenerCities.length === 0}
                  >
                    <option value="All Cities">All Cities</option>
                    {listenerCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </label>
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
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-3">
                <label className="flex flex-col gap-1 text-[11px]">
                  Date of Birth Start
                  <input
                    type="date"
                    value={artistDobRange.start}
                    onChange={(event) =>
                      setArtistDobRange((prev) => ({ ...prev, start: event.target.value }))
                    }
                    className="rounded border border-gray-300 px-2 py-1 text-[11px]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px]">
                  Date of Birth End
                  <input
                    type="date"
                    value={artistDobRange.end}
                    onChange={(event) =>
                      setArtistDobRange((prev) => ({ ...prev, end: event.target.value }))
                    }
                    className="rounded border border-gray-300 px-2 py-1 text-[11px]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px]">
                  Country
                  <select
                    value={artistCountryFilter}
                    onChange={(event) => {
                      setArtistCountryFilter(event.target.value);
                      setArtistCityFilter('All Cities'); // Reset city when country changes
                    }}
                    className="rounded border border-gray-300 px-2 py-1 text-[11px]"
                  >
                    <option value="All Countries">All Countries</option>
                    {artistCountries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[11px]">
                  City
                  <select
                    value={artistCityFilter}
                    onChange={(event) => setArtistCityFilter(event.target.value)}
                    className="rounded border border-gray-300 px-2 py-1 text-[11px]"
                    disabled={artistCountryFilter === 'All Countries' && artistCities.length === 0}
                  >
                    <option value="All Cities">All Cities</option>
                    {artistCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </label>
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

    const artists = Array.isArray(reportData.listenerArtistActivity)
      ? [...reportData.listenerArtistActivity]
      : [];

    if (artists.length === 0) {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          No artist activity recorded for the selected period.
        </div>
      );
    }

    return (
      <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-800">Artist Activity</h3>
          <p className="text-xs text-gray-600">Artists followed by this listener during the reporting period</p>
        </div>
        <div className="px-5 py-4 space-y-4">
          {artists.map((artist: any, idx: number) => {
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
          })}
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

    const albums = Array.isArray(reportData.listenerAlbumActivity)
      ? [...reportData.listenerAlbumActivity]
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
          <p className="text-xs text-gray-600">Albums this listener liked during the reporting period</p>
        </div>
        <div className="px-5 py-4 space-y-4">
          {albums.map((album: any, idx: number) => (
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
            </section>
                ))}
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

    const playlists = Array.isArray(reportData.listenerPlaylistActivity)
      ? [...reportData.listenerPlaylistActivity]
      : [];

    if (playlists.length === 0) {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-6 py-12 text-center text-gray-500">
          No playlist activity recorded for the selected period.
        </div>
      );
    }

    return (
      <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-800">Playlist Activity</h3>
          <p className="text-xs text-gray-600">Playlists created by this listener and their engagement</p>
        </div>
        <div className="px-5 py-4 space-y-4">
          {playlists.map((playlist: any, idx: number) => {
            const songs = Array.isArray(playlist.songs) ? playlist.songs : [];
            const likedBy = Array.isArray(playlist.likedBy) ? playlist.likedBy : [];

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
                    {playlist.isPublic && (
                      <div className="text-center min-w-[110px]">
                        <p className="font-semibold text-lg text-gray-900">{formatNumber(playlist.likes || 0)}</p>
                        <p className="uppercase tracking-wide text-xs text-gray-500">Likes</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-4 space-y-4">
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                      Songs in this Playlist
                    </h5>
                    {songs.length === 0 ? (
                      <div className="border border-dashed border-gray-300 rounded-md px-3 py-4 text-center text-sm text-gray-500">
                        No songs were added to this playlist during the selected period.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                          <thead className="bg-white">
                            <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              <th className="px-3.5 py-2.5 text-left">Song</th>
                              <th className="px-3.5 py-2.5 text-left">Artist</th>
                              <th className="px-3.5 py-2.5 text-left">Album</th>
                              <th className="px-3.5 py-2.5 text-left">Length</th>
                              <th className="px-3.5 py-2.5 text-left">Added On</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {songs.map((song: any, songIdx: number) => (
                              <tr
                                key={`${playlist.playlistId ?? idx}-song-${song.songId ?? songIdx}`}
                                className={songIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                              >
                                <td className="px-3.5 py-2.5 text-sm text-gray-900">{song.songName || 'Unknown Song'}</td>
                                <td className="px-3.5 py-2.5 text-sm text-gray-900">{song.artistUsername || 'Unknown Artist'}</td>
                                <td className="px-3.5 py-2.5 text-sm text-gray-700">{song.albumName || 'N/A'}</td>
                                <td className="px-3.5 py-2.5 text-sm text-gray-900">{formatTime(Number(song.duration || 0))}</td>
                                <td className="px-3.5 py-2.5 text-sm text-gray-900">{formatDate(song.addedAt)}</td>
                              </tr>
                            ))}
      </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {playlist.isPublic && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                        Users Who Liked This Playlist
                      </h5>
                      {likedBy.length === 0 ? (
                        <div className="border border-dashed border-gray-300 rounded-md px-3 py-4 text-center text-sm text-gray-500">
                          No likes were recorded for this playlist during the selected period.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                            <thead className="bg-white">
                              <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <th className="px-3.5 py-2.5 text-left">Username</th>
                                <th className="px-3.5 py-2.5 text-left">First Name</th>
                                <th className="px-3.5 py-2.5 text-left">Last Name</th>
                                <th className="px-3.5 py-2.5 text-left">Email</th>
                                <th className="px-3.5 py-2.5 text-left">Liked On</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {likedBy.map((user: any, likeIdx: number) => (
                                <tr
                                  key={`${playlist.playlistId ?? idx}-liked-${user.userId ?? likeIdx}`}
                                  className={likeIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                                >
                                  <td className="px-3.5 py-2.5 text-sm text-gray-900">{user.username || 'Unknown'}</td>
                                  <td className="px-3.5 py-2.5 text-sm text-gray-900">{user.firstName || 'N/A'}</td>
                                  <td className="px-3.5 py-2.5 text-sm text-gray-900">{user.lastName || 'N/A'}</td>
                                  <td className="px-3.5 py-2.5 text-sm text-gray-700 break-all">{user.email || 'N/A'}</td>
                                  <td className="px-3.5 py-2.5 text-sm text-gray-900">{formatDate(user.likedAt)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
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
          <div className="flex gap-3 self-end sm:self-auto print-controls">
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
