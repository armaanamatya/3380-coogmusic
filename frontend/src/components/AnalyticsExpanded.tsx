import React from 'react';

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

  // Helper function to convert playlist counts to percentage
  const ratioToPercentage = (publicPlaylists: number, privatePlaylists: number): string => {
    const publicNum = Number(publicPlaylists) || 0;
    const privateNum = Number(privatePlaylists) || 0;
    const total = publicNum + privateNum;
    if (total === 0) return 'N/A';
    const publicPct = (publicNum / total) * 100;
    const privatePct = (privateNum / total) * 100;
    return `Public: ${publicPct.toFixed(2)}%, Private: ${privatePct.toFixed(2)}%`;
  };

  // Calculate percentages from user counts
  const getUserPercentage = (listeners: number, artists: number): string => {
    const listenersNum = Number(listeners) || 0;
    const artistsNum = Number(artists) || 0;
    const total = listenersNum + artistsNum;
    if (total === 0) return 'N/A';
    const listenerPct = (listenersNum / total) * 100;
    const artistPct = (artistsNum / total) * 100;
    return `Listeners: ${listenerPct.toFixed(2)}%, Artists: ${artistPct.toFixed(2)}%`;
  };

  // Render individual user report
  const renderIndividualUserReport = () => {
    const { userInfo, loginStats, listenerStats, artistStats } = reportData;

    return (
      <tbody className="bg-white divide-y divide-gray-200">
        {/* User Info */}
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
            Date Created
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {new Date(userInfo?.dateCreated).toLocaleDateString()}
          </td>
        </tr>
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
            Country
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {userInfo?.country || 'N/A'}
          </td>
        </tr>
        {userInfo?.city && (
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
              City
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
              {userInfo.city}
            </td>
          </tr>
        )}
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
            Age
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {userInfo?.age || 'N/A'}
          </td>
        </tr>

        {/* Login Stats */}
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
            Total Logins
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {loginStats?.totalLogins || 0}
          </td>
        </tr>
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
            Total Time Logged In
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {formatTime(loginStats?.totalTimeLoggedIn || 0)}<br />
            <span className="text-xs text-gray-600">Average: {formatTime(loginStats?.averageTimeLoggedIn || 0)}</span>
          </td>
        </tr>

        {/* Listener Stats */}
        {listenerStats && (
          <>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Total Songs Played
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {listenerStats.totalSongsPlayed?.toLocaleString() || 0}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Distinct Songs Played
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {listenerStats.distinctSongsPlayed?.toLocaleString() || 0}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Playlists Created (Total)
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {listenerStats.playlistsCreated?.total || 0}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Public Playlists Created
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {listenerStats.playlistsCreated?.public || 0}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Private Playlists Created
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {listenerStats.playlistsCreated?.private || 0}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Playlists Liked
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {listenerStats.playlistsLiked || 0}
              </td>
            </tr>
            {listenerStats.topSongs && listenerStats.topSongs.length > 0 && (
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                  Top 5 Songs (Most Played)
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  <div className="space-y-1">
                    {listenerStats.topSongs.map((song: any, idx: number) => (
                      <div key={idx}>
                        {song.songName}: {song.playCount} plays
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            )}
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Songs Liked
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {listenerStats.songsLiked || 0}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Total Listening Duration
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {formatTime(listenerStats.totalListeningDuration || 0)}<br />
                <span className="text-xs text-gray-600">Average: {formatTime(listenerStats.averageListeningDuration || 0)}</span>
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Albums Liked
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {listenerStats.albumsLiked || 0}
              </td>
            </tr>
          </>
        )}

        {/* Artist Stats */}
        {artistStats && (
          <>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Total Song Plays
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {artistStats.totalSongPlays?.toLocaleString() || 0}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Distinct Songs Played
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {artistStats.distinctSongsPlayed?.toLocaleString() || 0}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Songs Added to Playlists
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {artistStats.songsAddedToPlaylists?.toLocaleString() || 0}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Distinct Songs Added to Playlists
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {artistStats.distinctSongsAddedToPlaylists?.toLocaleString() || 0}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Albums Created
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {artistStats.albumsCreated || 0}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Total Album Likes
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {artistStats.totalAlbumLikes || 0}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Distinct Albums Liked
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {artistStats.distinctAlbumsLiked || 0}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Total Listening Duration
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {formatTime(artistStats.totalListeningDuration || 0)}<br />
                <span className="text-xs text-gray-600">Average: {formatTime(artistStats.averageListeningDuration || 0)}</span>
              </td>
            </tr>
            {artistStats.topSongs && artistStats.topSongs.length > 0 && (
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                  Top 5 Songs (Most Played)
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  <div className="space-y-1">
                    {artistStats.topSongs.map((song: any, idx: number) => (
                      <div key={idx}>
                        {song.songName}: {song.playCount} plays
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            )}
            {artistStats.genreDistribution && artistStats.genreDistribution.length > 0 && (
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                  Genre Distribution
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  <div className="space-y-1">
                    {artistStats.genreDistribution.map((genre: any, idx: number) => (
                      <div key={idx}>
                        {genre.genre}: {genre.percentage}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            )}
          </>
        )}
      </tbody>
    );
  };

  // Render all users report
  const renderAllUsersReport = () => {
    return (
      <tbody className="bg-white divide-y divide-gray-200">
        {/* User Counts */}
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
            Users Created
          </td>
          <td className="px-6 py-4 text-sm text-gray-700">
            {includeListeners && includeArtists ? (
              <>
                Listeners: {reportData.userCounts?.listeners || 0}<br />
                Artists: {reportData.userCounts?.artists || 0}<br />
                <span className="text-xs text-gray-600">
                  {getUserPercentage(
                    Number(reportData.userCounts?.listeners) || 0,
                    Number(reportData.userCounts?.artists) || 0
                  )}
                </span>
              </>
            ) : includeListeners ? (
              `Listeners: ${reportData.userCounts?.listeners || 0}`
            ) : (
              `Artists: ${reportData.userCounts?.artists || 0}`
            )}
          </td>
        </tr>

        {/* Login Counts */}
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
            Total Logins
          </td>
          <td className="px-6 py-4 text-sm text-gray-700">
            {includeListeners && includeArtists ? (
              <>
                Listeners: {reportData.loginCounts?.listeners || 0}<br />
                Artists: {reportData.loginCounts?.artists || 0}<br />
                <span className="text-xs text-gray-600">
                  {getUserPercentage(
                    Number(reportData.loginCounts?.listeners) || 0,
                    Number(reportData.loginCounts?.artists) || 0
                  )}
                </span>
              </>
            ) : includeListeners ? (
              `Listeners: ${reportData.loginCounts?.listeners || 0}`
            ) : (
              `Artists: ${reportData.loginCounts?.artists || 0}`
            )}
          </td>
        </tr>

        {/* Login Time */}
        {includeListeners && reportData.loginTime?.listeners && (
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
              Total Login Time (Listeners)
            </td>
            <td className="px-6 py-4 text-sm text-gray-700">
              {formatTime(reportData.loginTime.listeners.total)}<br />
              <span className="text-xs text-gray-600">Average: {formatTime(reportData.loginTime.listeners.average)}</span>
            </td>
          </tr>
        )}
        {includeArtists && reportData.loginTime?.artists && (
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
              Total Login Time (Artists)
            </td>
            <td className="px-6 py-4 text-sm text-gray-700">
              {formatTime(reportData.loginTime.artists.total)}<br />
              <span className="text-xs text-gray-600">Average: {formatTime(reportData.loginTime.artists.average)}</span>
            </td>
          </tr>
        )}
        {includeListeners && includeArtists && reportData.loginTime?.all && (
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
              Total Login Time (All Users)
            </td>
            <td className="px-6 py-4 text-sm text-gray-700">
              {formatTime(reportData.loginTime.all.total)}<br />
              <span className="text-xs text-gray-600">Average: {formatTime(reportData.loginTime.all.average)}</span>
            </td>
          </tr>
        )}

        {/* Songs Played */}
        {includeListeners && (
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
              Songs Played
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
              {reportData.songsListened?.toLocaleString() || 0}
            </td>
          </tr>
        )}

        {/* Songs Uploaded */}
        {includeArtists && (
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
              Songs Uploaded
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
              {reportData.songsUploaded?.toLocaleString() || 0}
            </td>
          </tr>
        )}

        {/* Playlist Statistics */}
        {includePlaylistStatistics && reportData.playlistStats && (
          <>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Playlists Created
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {reportData.playlistStats.totalCreated || 0}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Private Playlists
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {reportData.playlistStats.privatePlaylists || 0}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Public Playlists
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {reportData.playlistStats.publicPlaylists || 0}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Playlist Ratio (Public:Private)
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">
                {ratioToPercentage(
                  Number(reportData.playlistStats.publicPlaylists) || 0,
                  Number(reportData.playlistStats.privatePlaylists) || 0
                )}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Playlists Liked
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {reportData.playlistStats.totalLiked || 0}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Distinct Playlists Liked
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {reportData.playlistStats.distinctLiked || 0}
              </td>
            </tr>
          </>
        )}

        {/* Album Statistics */}
        {includeAlbumStatistics && reportData.albumStats && (
          <>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Album Likes
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {reportData.albumStats.totalLiked || 0}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Distinct Albums Liked
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {reportData.albumStats.distinctLiked || 0}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                Albums Created
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {reportData.albumStats.totalCreated || 0}
              </td>
            </tr>
          </>
        )}

        {/* Songs Liked */}
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
            Songs Liked
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {reportData.songsLiked?.toLocaleString() || 0}
          </td>
        </tr>
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
            Distinct Songs Liked
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {reportData.distinctSongsLiked?.toLocaleString() || 0}
          </td>
        </tr>

        {/* Artists Followed */}
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
            Artists Followed
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {reportData.artistsFollowed?.toLocaleString() || 0}
          </td>
        </tr>
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
            Distinct Artists Followed
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {reportData.distinctArtistsFollowed?.toLocaleString() || 0}
          </td>
        </tr>

        {/* Age Demographics */}
        {reportData.ageDemographics && reportData.ageDemographics.length > 0 && (
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
              Age Demographics
            </td>
            <td className="px-6 py-4 text-sm text-gray-700">
              <div className="space-y-1">
                {reportData.ageDemographics.map((demo: any, idx: number) => (
                  <div key={idx}>
                    {demo.range}: {demo.count} ({demo.ratio})
                  </div>
                ))}
              </div>
            </td>
          </tr>
        )}

        {/* Country Statistics */}
        {includeGeographics && reportData.countryStats && reportData.countryStats.length > 0 && (
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
              Top 5 Countries
            </td>
            <td className="px-6 py-4 text-sm text-gray-700">
              <div className="space-y-1">
                {reportData.countryStats.map((country: any, idx: number) => (
                  <div key={idx}>
                    {country.country}: {country.count} ({country.ratio})
                  </div>
                ))}
              </div>
            </td>
          </tr>
        )}
      </tbody>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-red-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">Analytics Report</h2>
            <p className="text-red-100 mt-1">
              {isIndividualUser ? 'Individual User Analytics' : 'User Engagement & Business Performance'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-3xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                    Metric
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              {isIndividualUser ? renderIndividualUserReport() : renderAllUsersReport()}
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
