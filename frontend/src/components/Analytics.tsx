import React, { useState } from 'react';
import { analyticsApi } from '../services/api';
import { AnalyticsExpanded } from './AnalyticsExpanded';

const Analytics = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // User selection state
  const [userSelection, setUserSelection] = useState<'all' | 'individual'>('all');
  
  // All users options
  const [includeListeners, setIncludeListeners] = useState(true);
  const [includeArtists, setIncludeArtists] = useState(true);
  const [includeGeographics, setIncludeGeographics] = useState(false);
  const [includePlaylistStatistics, setIncludePlaylistStatistics] = useState(false);
  const [includeAlbumStatistics, setIncludeAlbumStatistics] = useState(false);
  const [showSongStats, setShowSongStats] = useState(true);
  const [showArtistStats, setShowArtistStats] = useState(true);
  const [showAgeDemographics, setShowAgeDemographics] = useState(true);
  const [includeSuspendedAccounts, setIncludeSuspendedAccounts] = useState(false);
  
  // Individual user options - single username input
  const [individualUsername, setIndividualUsername] = useState<string>('');
  
  // Report state
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [reportError, setReportError] = useState<string>('');

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStartDate(value);
    
    // Clear error when user starts typing
    validateDates(value, endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEndDate(value);
    
    // Clear error when user starts typing
    validateDates(startDate, value);
  };

  const validateDates = (start: string, end: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minDate = new Date('1900-01-01');

    const startDateObj = start ? new Date(start) : null;
    const endDateObj = end ? new Date(end) : null;

    const newErrors: Record<string, string> = {};

    if (!start) {
      newErrors.startDate = 'Please select a start date';
    } else if (Number.isNaN(startDateObj?.getTime())) {
      newErrors.startDate = 'Start date is invalid';
    } else {
      if (startDateObj! < minDate) {
        newErrors.startDate = 'Start date cannot be before 1900-01-01';
      } else if (startDateObj! > today) {
        newErrors.startDate = 'Start date cannot be in the future';
      }
    }

    if (!end) {
      newErrors.endDate = 'Please select an end date';
    } else if (Number.isNaN(endDateObj?.getTime())) {
      newErrors.endDate = 'End date is invalid';
    } else {
      if (endDateObj! < minDate) {
        newErrors.endDate = 'End date cannot be before 1900-01-01';
      } else if (endDateObj! > today) {
        newErrors.endDate = 'End date cannot be in the future';
      }
    }

    if (!newErrors.startDate && !newErrors.endDate && startDateObj && endDateObj) {
      if (startDateObj >= endDateObj) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(prev => ({
      ...prev,
      startDate: newErrors.startDate ?? '',
      endDate: newErrors.endDate ?? ''
    }));

    return newErrors;
  };

  const handleIncludeListenersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeListeners(e.target.checked);
    if (!e.target.checked && !includeArtists) {
      setErrors(prev => ({ 
        ...prev, 
        userType: 'At least one user type (Listeners or Artists) must be selected' 
      }));
    } else {
      setErrors(prev => {
        const { userType, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleIncludeArtistsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeArtists(e.target.checked);
    if (!e.target.checked && !includeListeners) {
      setErrors(prev => ({ 
        ...prev, 
        userType: 'At least one user type (Listeners or Artists) must be selected' 
      }));
    } else {
      setErrors(prev => {
        const { userType, ...rest } = prev;
        return rest;
      });
    }
  };


  // Generate report handler
  const handleGenerateReport = async () => {
    const dateValidation = validateDates(startDate, endDate);
    if (dateValidation.startDate || dateValidation.endDate) {
      setReportError('Please resolve the highlighted date issues before generating the report.');
      return;
    }

    setLoading(true);
    setReportError('');
    setReportData(null);

    try {
      let response;
      
      if (userSelection === 'individual') {
        // Validate username
        if (!individualUsername.trim()) {
          setReportError('Please enter a username');
          setLoading(false);
          return;
        }

        response = await analyticsApi.getIndividualReport({
          username: individualUsername.trim(),
          startDate,
          endDate
        });
      } else {
        // Validate user types
        if (!includeListeners && !includeArtists) {
          setReportError('Please select at least one user type (Listeners or Artists)');
          setLoading(false);
          return;
        }

        response = await analyticsApi.getReport({
          startDate,
          endDate,
          includeListeners,
          includeArtists,
          includeAlbumStatistics,
          includeGeographics,
          includePlaylistStatistics,
          showSongStats,
          showArtistStats,
          showAgeDemographics,
          includeSuspendedAccounts
        });
      }

      const data = await response.json();

      if (response.ok) {
        setReportData({
          ...data,
          showSongStats,
          showArtistStats,
          showAgeDemographics,
          meta: {
            startDate,
            endDate,
            generatedAt: new Date().toISOString(),
            includeListeners,
            includeArtists,
            includePlaylistStatistics,
            includeAlbumStatistics,
            includeGeographics,
            includeSuspendedAccounts
          }
        });
      } else {
        setReportError(data.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setReportError('Failed to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };


  // Get today's date in YYYY-MM-DD format for max attribute
  const today = new Date().toISOString().split('T')[0];
  const minDate = '1900-01-01';

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-red-700 mb-4">User Engagement & Content Analytics</h2>
        
        {/* Date Range Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium mb-2 text-gray-700">
              Starting Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={startDate}
              onChange={handleStartDateChange}
              min={minDate}
              max={today}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>
            )}
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium mb-2 text-gray-700">
              Finishing Date
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={endDate}
              onChange={handleEndDateChange}
              min={startDate || minDate}
              max={today}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>
            )}
          </div>
        </div>

        {/* User Selection Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* All Users Box */}
          <div className="border border-gray-300 rounded-lg p-6 bg-white">
            <div className="flex items-center mb-4">
              <input
                type="radio"
                id="allUsers"
                name="userSelection"
                value="all"
                checked={userSelection === 'all'}
                onChange={(e) => setUserSelection(e.target.value as 'all' | 'individual')}
                className="w-4 h-4 text-red-600 focus:ring-red-500 focus:ring-2"
              />
              <label htmlFor="allUsers" className="ml-2 text-lg font-semibold text-gray-700">
                All Users
              </label>
            </div>
            
            {userSelection === 'all' && (
              <div className="ml-6 space-y-4 mt-4">
                {/* User Type Checkboxes */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeListeners"
                      checked={includeListeners}
                      onChange={handleIncludeListenersChange}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 focus:ring-2 border-gray-300 rounded"
                    />
                    <label htmlFor="includeListeners" className="ml-2 text-sm font-medium text-gray-700">
                      Listeners
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeArtists"
                      checked={includeArtists}
                      onChange={handleIncludeArtistsChange}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 focus:ring-2 border-gray-300 rounded"
                    />
                    <label htmlFor="includeArtists" className="ml-2 text-sm font-medium text-gray-700">
                      Artists
                    </label>
                  </div>
                </div>

                <div className="flex items-center pt-2">
                  <input
                    type="checkbox"
                    id="includeSuspendedAccounts"
                    checked={includeSuspendedAccounts}
                    onChange={(e) => setIncludeSuspendedAccounts(e.target.checked)}
                    className="w-4 h-4 text-red-600 focus:ring-red-500 focus-ring-2 border-gray-300 rounded"
                  />
                  <label htmlFor="includeSuspendedAccounts" className="ml-2 text-sm font-medium text-gray-700">
                    Include Suspended/Banned Accounts
                  </label>
                </div>

                {/* Album Statistics Checkbox */}
                {/* Display Options */}
                <div className="space-y-2 border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700">Summary Display Options</h4>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includePlaylistStatistics"
                      checked={includePlaylistStatistics}
                      onChange={(e) => setIncludePlaylistStatistics(e.target.checked)}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 focus:ring-2 border-gray-300 rounded"
                    />
                    <label htmlFor="includePlaylistStatistics" className="ml-2 text-sm font-medium text-gray-700">
                      Playlist Statistics
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showSongStats"
                      checked={showSongStats}
                      onChange={(e) => setShowSongStats(e.target.checked)}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 focus:ring-2 border-gray-300 rounded"
                    />
                    <label htmlFor="showSongStats" className="ml-2 text-sm font-medium text-gray-700">
                      Song Stats
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showArtistStats"
                      checked={showArtistStats}
                      onChange={(e) => setShowArtistStats(e.target.checked)}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 focus:ring-2 border-gray-300 rounded"
                    />
                    <label htmlFor="showArtistStats" className="ml-2 text-sm font-medium text-gray-700">
                      Artist Stats
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showAgeDemographics"
                      checked={showAgeDemographics}
                      onChange={(e) => setShowAgeDemographics(e.target.checked)}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 focus-ring-2 border-gray-300 rounded"
                    />
                    <label htmlFor="showAgeDemographics" className="ml-2 text-sm font-medium text-gray-700">
                      Age Demographics
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeGeographics"
                      checked={includeGeographics}
                      onChange={(e) => setIncludeGeographics(e.target.checked)}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 focus-ring-2 border-gray-300 rounded"
                    />
                    <label htmlFor="includeGeographics" className="ml-2 text-sm font-medium text-gray-700">
                      Geographics
                    </label>
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeAlbumStatistics"
                    checked={includeAlbumStatistics}
                    onChange={(e) => setIncludeAlbumStatistics(e.target.checked)}
                    className="w-4 h-4 text-red-600 focus:ring-red-500 focus:ring-2 border-gray-300 rounded"
                  />
                  <label htmlFor="includeAlbumStatistics" className="ml-2 text-sm font-medium text-gray-700">
                    Album Statistics
                  </label>
                </div>

                {/* Error message for user type selection */}
                {errors.userType && (
                  <p className="text-sm text-red-500 mt-2">{errors.userType}</p>
                )}

                {/* Generate Report Button */}
                <div className="mt-6">
                  <button
                    onClick={handleGenerateReport}
                    disabled={
                      loading ||
                      !startDate ||
                      !endDate ||
                      !!errors.startDate ||
                      !!errors.endDate ||
                      (!includeListeners && !includeArtists)
                    }
                    className="w-full bg-red-700 hover:bg-red-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out transform hover:scale-[1.02] disabled:transform-none"
                  >
                    {loading ? 'Generating Report...' : 'Generate Report'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Individual User Box */}
          <div className="border border-gray-300 rounded-lg p-6 bg-white">
            <div className="flex items-center mb-4">
              <input
                type="radio"
                id="individualUser"
                name="userSelection"
                value="individual"
                checked={userSelection === 'individual'}
                onChange={(e) => setUserSelection(e.target.value as 'all' | 'individual')}
                className="w-4 h-4 text-red-600 focus:ring-red-500 focus:ring-2"
              />
              <label htmlFor="individualUser" className="ml-2 text-lg font-semibold text-gray-700">
                Individual User
              </label>
            </div>
            
            {userSelection === 'individual' && (
              <div className="ml-6 mt-4 space-y-4">
                {/* Username Input */}
                <div>
                  <label 
                    htmlFor="individualUsername" 
                    className="block text-sm font-medium mb-2 text-gray-700"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    id="individualUsername"
                    name="individualUsername"
                    value={individualUsername}
                    onChange={(e) => setIndividualUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  />
                </div>

                {/* Generate Report Button */}
                <div>
                  <button
                    onClick={handleGenerateReport}
                    disabled={loading || !startDate || !endDate || !individualUsername.trim()}
                    className="w-full bg-red-700 hover:bg-red-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out transform hover:scale-[1.02] disabled:transform-none"
                  >
                    {loading ? 'Generating Report...' : 'Generate Report'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Report Error */}
        {reportError && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{reportError}</p>
          </div>
        )}
      </div>

      {/* Analytics Report Expanded Modal */}
      {reportData && (
        <AnalyticsExpanded
          reportData={reportData}
          onClose={() => setReportData(null)}
          isIndividualUser={userSelection === 'individual'}
          includeListeners={includeListeners}
          includeArtists={includeArtists}
          includePlaylistStatistics={includePlaylistStatistics}
          includeAlbumStatistics={includeAlbumStatistics}
          includeGeographics={includeGeographics}
        />
      )}
    </div>
  );
};

export default Analytics;

