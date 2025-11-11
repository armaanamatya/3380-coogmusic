import { Pool } from 'mysql2/promise';
import * as analyticsModel from '../models/analyticsModel.js';
import { ExtendedRequest, ServerResponse } from '../types/index.js';

export async function getAnalyticsReport(
  pool: Pool,
  req: ExtendedRequest,
  res: ServerResponse
): Promise<void> {
  try {
    const body = req.body || {};
    const {
      startDate,
      endDate,
      includeListeners,
      includeArtists,
      includePlaylistStatistics,
      includeAlbumStatistics,
      includeGeographics,
      includeSuspendedAccounts,
      showSongStats,
      showArtistStats,
      showAgeDemographics
    } = body;

    // Validate required fields
    if (!startDate || !endDate) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Start date and end date are required' }));
      return;
    }

    if (!includeListeners && !includeArtists) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'At least one user type (Listeners or Artists) must be selected' }));
      return;
    }

    const filters: analyticsModel.AnalyticsFilters = {
      startDate,
      endDate,
      includeListeners: !!includeListeners,
      includeArtists: !!includeArtists,
      includePlaylistStatistics: !!includePlaylistStatistics,
      includeAlbumStatistics: !!includeAlbumStatistics,
      includeGeographics: !!includeGeographics,
      includeSuspendedAccounts: !!includeSuspendedAccounts,
      showSongStats: showSongStats !== false,
      showArtistStats: showArtistStats !== false,
      showAgeDemographics: showAgeDemographics !== false
    };

    const report = await analyticsModel.getAnalyticsReport(pool, filters);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(report));
  } catch (error: any) {
    console.error('Error getting analytics report:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

export async function getIndividualUserReport(
  pool: Pool,
  req: ExtendedRequest,
  res: ServerResponse
): Promise<void> {
  try {
    const body = req.body || {};
    const { username, startDate, endDate } = body;

    // Validate required fields
    if (!username || !startDate || !endDate) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Username, start date, and end date are required' }));
      return;
    }

    let report;
    try {
      report = await analyticsModel.getIndividualUserReport(pool, username, startDate, endDate);
    } catch (error: any) {
      // If the error is about Analyst user or not found, return 404
      if (error.message.includes('Analyst') || error.message.includes('not found')) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
        return;
      }
      if (error.message.includes('Admin')) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
        return;
      }
      // Otherwise, rethrow for 500 error handling below
      throw error;
    }

    if (!report) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `User not found: ${username}. Make sure the username is correct and the user is not an Analyst.` }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(report));
  } catch (error: any) {
    console.error('Error getting individual user report:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

