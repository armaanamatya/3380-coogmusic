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
  const [viewMode, setViewMode] = useState<'summary' | 'userReport' | 'artistActivity' | 'albumActivity' | 'playlistActivity' | 'songActivity'>('summary');
  const [expandedFollowerKeys, setExpandedFollowerKeys] = useState<Record<string, boolean>>({});
  const [followerColumnToggles, setFollowerColumnToggles] = useState({
    showSongListens: false,
    showSongLikes: false,
    showListenDuration: false,
    showAlbumLikes: false
  });
  const [listenerDobRange, setListenerDobRange] = useState({ start: '', end: '' });
  const [artistDobRange, setArtistDobRange] = useState({ start: '', end: '' });
  const [userActivityColumns, setUserActivityColumns] = useState({
    showEmail: false,
    showCountry: false,
    showCity: false
  });
  const [expandedSummaryCharts, setExpandedSummaryCharts] = useState<{ country: boolean; age: boolean }>({
    country: false,
    age: false
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

    return (
      <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-800">Album Activity</h3>
          <p className="text-xs text-gray-600">Performance details for albums released in the selected period</p>
        </div>
        <div className="px-5 py-4 space-y-4">
        {albums.map((album: any, idx: number) => {
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
        if ((a.songCount ?? 0) !== (b.songCount ?? 0)) {
          return (b.songCount ?? 0) - (a.songCount ?? 0);
        }
        return (a.playlistName || '').localeCompare(b.playlistName || '');
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

      return (
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
          {sorted.map((playlist, idx) => {
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

  const handleExportPdf = useCallback(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'visible';
    window.print();
    document.body.style.overflow = previous;
  }, []);

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
      title: 'User Creation & Engagement',
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

    return (
      <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-800">Song Activity</h3>
          <p className="text-xs text-gray-600">Detailed engagement for songs played during the reporting period</p>
        </div>
        <div className="px-5 py-4 space-y-4">
          {songs.map((song: any, idx: number) => {
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
                            <th className="px-3.5 py-2.5 text-left">Email</th>
                            <th className="px-3.5 py-2.5 text-center">Listens</th>
                            <th className="px-3.5 py-2.5 text-center">Avg Listen Duration</th>
                            <th className="px-3.5 py-2.5 text-center">Total Listen Duration</th>
                            <th className="px-3.5 py-2.5 text-left">Liked?</th>
                            <th className="px-3.5 py-2.5 text-left">Liked On</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {listenerDetails.map((listener: any, listenerIdx: number) => (
                            <tr
                              key={`${song.songId ?? idx}-listener-${listenerIdx}`}
                              className={listenerIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                            >
                              <td className="px-3.5 py-2.5 text-sm text-gray-900">{listener.username || 'Unknown User'}</td>
                              <td className="px-3.5 py-2.5 text-sm text-gray-700 break-all">{listener.email || 'N/A'}</td>
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
      (b?.username || '').localeCompare(a?.username || '')
    );

    return (
      <div className="analytics-report-section bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-800">Artist Activity</h3>
          <p className="text-xs text-gray-600">Key metrics for artists included in this report</p>
        </div>
        <div className="px-5 py-4 space-y-4">
          {artists.map((artist: any, idx: number) => {
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
                    Followers
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
                          {followers.map((follower: any, followerIdx: number) => (
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
                  ) : (
                    <div className="text-sm text-gray-500">
                      Click “Show followers” to reveal this list.
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
            <SummarySection
              key={`${section.title}-${idx}`}
              title={section.title}
              rows={section.rows}
            />
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
                <span className="text-[11px] text-gray-500">{ageHistogramData.rows.length} ranges</span>
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
    const filteredListeners = (reportData.listenerUsers ?? []).filter((user: any) => {
      if (!listenerDobRange.start && !listenerDobRange.end) {
        return true;
      }
      return isDateWithinRange(user.dateOfBirth, listenerDobRange);
    });
    const filteredArtists = (reportData.artistUsers ?? []).filter((user: any) => {
      if (!artistDobRange.start && !artistDobRange.end) {
        return true;
      }
      return isDateWithinRange(user.dateOfBirth, artistDobRange);
    });

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
              </div>
              {filteredListeners.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-lg px-5 py-8 text-center text-sm text-gray-500">
                  No listeners match the selected date of birth range.
                </div>
              ) : (
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
                    {filteredListeners.map((user: any, idx: number) => (
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
              </div>
              {filteredArtists.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-lg px-5 py-8 text-center text-sm text-gray-500">
                  No artists match the selected date of birth range.
                </div>
              ) : (
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
                      {filteredArtists.map((user: any, idx: number) => (
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
                    <th className="px-3.5 py-2.5 text-left">Email</th>
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
                      <td className="px-3.5 py-2.5 text-sm text-gray-700 break-all">{listener.email || 'N/A'}</td>
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
                                <th className="px-3.5 py-2.5 text-left">Email</th>
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
                                  <td className="px-3.5 py-2.5 text-sm text-gray-700 break-all">{listener.email || 'N/A'}</td>
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
              onClick={handleExportPdf}
              className="px-4 py-2 bg-white text-red-600 font-semibold rounded-lg shadow-sm hover:bg-red-50 transition-colors"
            >
              Export PDF
            </button>
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
        <div className={`analytics-report-page ${viewMode === 'summary' ? '' : 'hidden'} print-visible`}>
            {renderSummaryView()}
          </div>
          {!isIndividualUser && (
          <div className={`analytics-report-page ${viewMode === 'userReport' ? '' : 'hidden'} print-visible`}>
              {renderUserActivityView()}
        </div>
          )}
          {availableArtistActivity && (
            <div className={`analytics-report-page ${viewMode === 'artistActivity' ? '' : 'hidden'} print-visible`}>
              {renderArtistActivity()}
            </div>
          )}
          {availablePlaylistActivity && (
            <div className={`analytics-report-page ${viewMode === 'playlistActivity' ? '' : 'hidden'} print-visible`}>
              {renderPlaylistActivity()}
            </div>
          )}
          {availableAlbumActivity && (
            <div className={`analytics-report-page ${viewMode === 'albumActivity' ? '' : 'hidden'} print-visible`}>
              {renderAlbumActivity()}
            </div>
          )}
          {showSongStats && (
          <div className={`analytics-report-page ${viewMode === 'songActivity' ? '' : 'hidden'} print-visible`}>
              {renderSongActivity()}
            </div>
          )}
          {!showSongStats && (
            <div className="hidden print-visible bg-white border border-dashed border-gray-300 rounded-lg px-5 py-8 text-center text-gray-500">
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
