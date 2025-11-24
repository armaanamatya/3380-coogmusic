import dotenv from 'dotenv';
import { createConnection, testConnection } from './src/database.js';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

dotenv.config();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api`;

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  data?: any;
  duration?: number;
}

interface TestUser {
  id: number;
  username: string;
  password: string;
  token?: string;
}

interface TestData {
  users: TestUser[];
  songId?: number;
  albumId?: number;
  playlistId?: number;
  artistId?: number;
  genreId?: number;
}

const results: TestResult[] = [];
const testData: TestData = { users: [] };

async function test(name: string, testFn: () => Promise<any>): Promise<void> {
  const start = Date.now();
  try {
    const data = await testFn();
    const duration = Date.now() - start;
    results.push({ name, success: true, data, duration });
    console.log(`✅ ${name} (${duration}ms)`);
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const keys = Object.keys(data);
      if (keys.length > 0 && keys.length <= 3) {
        console.log(`   → ${JSON.stringify(data).substring(0, 100)}`);
      }
    } else if (Array.isArray(data)) {
      console.log(`   → ${data.length} items returned`);
    }
  } catch (error: any) {
    const duration = Date.now() - start;
    results.push({ 
      name, 
      success: false, 
      error: error.message || String(error),
      duration 
    });
    console.log(`❌ ${name} (${duration}ms)`);
    console.log(`   Error: ${error.message || String(error)}`);
  }
}

async function makeRequest(method: string, path: string, body?: any, token?: string): Promise<any> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Cookie'] = `session=${token}`;
  }
  
  const options: RequestInit = {
    method,
    headers,
    credentials: 'include'
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  const text = await response.text();
  
  try {
    const json = JSON.parse(text);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${json.error || json.message || text}`);
    }
    return json;
  } catch {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    return text;
  }
}

async function makeFormRequest(method: string, path: string, formData: FormData, token?: string): Promise<any> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {};
  
  if (token) {
    headers['Cookie'] = `session=${token}`;
  }
  
  const options: RequestInit = {
    method,
    headers,
    credentials: 'include',
    body: formData as any
  };
  
  const response = await fetch(url, options);
  const text = await response.text();
  
  try {
    const json = JSON.parse(text);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${json.error || json.message || text}`);
    }
    return json;
  } catch {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    return text;
  }
}

async function createTestUser(userType: string = 'Listener', suffix: string = ''): Promise<TestUser> {
  const timestamp = Date.now();
  const username = `testuser${suffix}_${timestamp}`;
  const userData = {
    username,
    password: 'testpass123',
    firstName: 'Test',
    lastName: `User${suffix}`,
    dateOfBirth: '1990-01-01',
    email: `test${suffix}_${timestamp}@test.com`,
    userType,
    country: 'USA',
    city: 'Test City'
  };
  
  const result = await makeRequest('POST', '/auth/register', userData);
  
  if (!result.userId) {
    throw new Error('Failed to create test user');
  }
  
  return {
    id: result.userId,
    username,
    password: userData.password
  };
}

async function loginUser(user: TestUser): Promise<string> {
  const result = await makeRequest('POST', '/auth/login', {
    username: user.username,
    password: user.password
  });
  
  return result.sessionId || result.token || 'logged-in';
}

async function cleanup(): Promise<void> {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    const pool = await createConnection();
    
    // Clean up test users
    for (const user of testData.users) {
      if (user.id) {
        try {
          await pool.query('DELETE FROM userprofile WHERE UserID = ?', [user.id]);
          console.log(`   Deleted test user: ${user.username}`);
        } catch (error: any) {
          console.log(`   Failed to delete user ${user.username}: ${error.message}`);
        }
      }
    }
    
    await pool.end();
  } catch (error: any) {
    console.log(`   Cleanup error: ${error.message}`);
  }
}

async function runHealthTests(): Promise<void> {
  console.log('\n🏥 Health & Connectivity Tests');
  console.log('='.repeat(60));
  
  await test('Database Connection', async () => {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    return { connected: true };
  });
  
  await test('Health Check', async () => {
    return await makeRequest('GET', '/health');
  });
  
  await test('Test Endpoint', async () => {
    return await makeRequest('GET', '/test');
  });
  
  await test('Database Test Endpoint', async () => {
    return await makeRequest('GET', '/test-db');
  });
}

async function runAuthTests(): Promise<void> {
  console.log('\n🔐 Authentication Tests');
  console.log('='.repeat(60));
  
  // Create test users
  const listener = await test('Register Listener User', async () => {
    const user = await createTestUser('Listener', 'listener');
    testData.users.push(user);
    return { userId: user.id, username: user.username };
  });
  
  const artist = await test('Register Artist User', async () => {
    const user = await createTestUser('Artist', 'artist');
    testData.users.push(user);
    testData.artistId = user.id;
    return { userId: user.id, username: user.username };
  });
  
  // Login tests
  await test('Login Listener', async () => {
    if (testData.users.length > 0) {
      const token = await loginUser(testData.users[0]);
      testData.users[0].token = token;
      return { loggedIn: true, hasToken: !!token };
    }
    throw new Error('No test user available');
  });
  
  await test('Login Artist', async () => {
    if (testData.users.length > 1) {
      const token = await loginUser(testData.users[1]);
      testData.users[1].token = token;
      return { loggedIn: true, hasToken: !!token };
    }
    throw new Error('No artist test user available');
  });
  
  // Invalid login test
  await test('Invalid Login Attempt', async () => {
    try {
      await makeRequest('POST', '/auth/login', {
        username: 'nonexistent',
        password: 'wrong'
      });
      throw new Error('Should have failed');
    } catch (error: any) {
      if (error.message.includes('Should have failed')) {
        throw error;
      }
      return { expectedFailure: true };
    }
  });
}

async function runGenreTests(): Promise<void> {
  console.log('\n🎵 Genre API Tests');
  console.log('='.repeat(60));
  
  await test('Get All Genres', async () => {
    const result = await makeRequest('GET', '/genres');
    if (!result.genres || !Array.isArray(result.genres)) {
      throw new Error('Invalid response format');
    }
    if (result.genres.length > 0) {
      testData.genreId = result.genres[0].GenreID;
    }
    return { count: result.genres.length };
  });
  
  await test('Get Genres With Listen Counts', async () => {
    const result = await makeRequest('GET', '/genres/with-listens');
    if (!result.genres || !Array.isArray(result.genres)) {
      throw new Error('Invalid response format');
    }
    return { count: result.genres.length };
  });
  
  if (testData.genreId) {
    await test('Get Specific Genre', async () => {
      const result = await makeRequest('GET', `/genres/${testData.genreId}`);
      if (!result.genre) {
        throw new Error('Genre not found');
      }
      return { genreId: result.genre.GenreID };
    });
    
    await test('Get Songs by Genre', async () => {
      const result = await makeRequest('GET', `/genres/${testData.genreId}/songs`);
      if (!result.songs || !Array.isArray(result.songs)) {
        throw new Error('Invalid response format');
      }
      return { count: result.songs.length };
    });
  }
}

async function runArtistTests(): Promise<void> {
  console.log('\n🎤 Artist API Tests');
  console.log('='.repeat(60));
  
  await test('Get All Artists', async () => {
    const result = await makeRequest('GET', '/artists');
    if (!result.artists || !Array.isArray(result.artists)) {
      throw new Error('Invalid response format');
    }
    return { count: result.artists.length };
  });
  
  await test('Get Top Artists', async () => {
    const result = await makeRequest('GET', '/artists/top');
    if (!result.artists || !Array.isArray(result.artists)) {
      throw new Error('Invalid response format');
    }
    return { count: result.artists.length };
  });
  
  await test('Get Recommended Artists', async () => {
    const result = await makeRequest('GET', '/artists/recommended');
    if (!result.artists || !Array.isArray(result.artists)) {
      throw new Error('Invalid response format');
    }
    return { count: result.artists.length };
  });
  
  if (testData.artistId) {
    await test('Get Specific Artist', async () => {
      const result = await makeRequest('GET', `/artists/${testData.artistId}`);
      if (!result.artist) {
        throw new Error('Artist not found');
      }
      return { artistId: result.artist.ArtistID };
    });
    
    await test('Get Artist Albums', async () => {
      const result = await makeRequest('GET', `/artists/${testData.artistId}/albums`);
      if (!result.albums || !Array.isArray(result.albums)) {
        throw new Error('Invalid response format');
      }
      return { count: result.albums.length };
    });
    
    await test('Get Artist Songs', async () => {
      const result = await makeRequest('GET', `/artists/${testData.artistId}/songs`);
      if (!result.songs || !Array.isArray(result.songs)) {
        throw new Error('Invalid response format');
      }
      return { count: result.songs.length };
    });
  }
}

async function runAlbumTests(): Promise<void> {
  console.log('\n💿 Album API Tests');
  console.log('='.repeat(60));
  
  await test('Get All Albums', async () => {
    const result = await makeRequest('GET', '/albums');
    if (!result.albums || !Array.isArray(result.albums)) {
      throw new Error('Invalid response format');
    }
    if (result.albums.length > 0) {
      testData.albumId = result.albums[0].AlbumID;
    }
    return { count: result.albums.length };
  });
  
  await test('Get Top Albums', async () => {
    const result = await makeRequest('GET', '/albums/top');
    if (!result.albums || !Array.isArray(result.albums)) {
      throw new Error('Invalid response format');
    }
    return { count: result.albums.length };
  });
  
  await test('Get Top Rated Albums', async () => {
    const result = await makeRequest('GET', '/albums/top-rated');
    if (!result.albums || !Array.isArray(result.albums)) {
      throw new Error('Invalid response format');
    }
    return { count: result.albums.length };
  });
  
  if (testData.artistId) {
    await test('Get Albums by Artist', async () => {
      const result = await makeRequest('GET', `/albums?artistId=${testData.artistId}`);
      if (!result.albums || !Array.isArray(result.albums)) {
        throw new Error('Invalid response format');
      }
      return { count: result.albums.length };
    });
  }
  
  // Create Album Test (requires authentication)
  if (testData.users.length > 1 && testData.users[1].token && testData.genreId) {
    await test('Create Album', async () => {
      const albumData = {
        albumName: `Test Album ${Date.now()}`,
        releaseDate: '2023-01-01',
        genreId: testData.genreId,
        description: 'Test album description'
      };
      
      const result = await makeRequest('POST', '/albums', albumData, testData.users[1].token);
      if (result.albumId) {
        testData.albumId = result.albumId;
      }
      return { albumId: result.albumId };
    });
  }
  
  if (testData.albumId) {
    await test('Get Specific Album', async () => {
      const result = await makeRequest('GET', `/albums/${testData.albumId}`);
      if (!result.album) {
        throw new Error('Album not found');
      }
      return { albumId: result.album.AlbumID };
    });
    
    await test('Get Album Stats', async () => {
      const result = await makeRequest('GET', `/albums/${testData.albumId}/stats`);
      return result;
    });
    
    // Update Album Test
    if (testData.users.length > 1 && testData.users[1].token) {
      await test('Update Album', async () => {
        const updateData = {
          albumName: `Updated Test Album ${Date.now()}`,
          description: 'Updated description'
        };
        
        const result = await makeRequest('PUT', `/albums/${testData.albumId}`, updateData, testData.users[1].token);
        return result;
      });
    }
  }
}

async function runSongTests(): Promise<void> {
  console.log('\n🎶 Song API Tests');
  console.log('='.repeat(60));
  
  await test('Get Songs with Pagination', async () => {
    const result = await makeRequest('GET', '/song?page=1&limit=10');
    if (!result.songs || !Array.isArray(result.songs)) {
      throw new Error('Invalid response format');
    }
    if (result.songs.length > 0) {
      testData.songId = result.songs[0].SongID;
    }
    return { count: result.songs.length, total: result.total };
  });
  
  await test('Get Top Songs', async () => {
    const result = await makeRequest('GET', '/song/top');
    if (!result.songs || !Array.isArray(result.songs)) {
      throw new Error('Invalid response format');
    }
    return { count: result.songs.length };
  });
  
  await test('Get Top Rated Songs', async () => {
    const result = await makeRequest('GET', '/songs/top-rated');
    if (!result.songs || !Array.isArray(result.songs)) {
      throw new Error('Invalid response format');
    }
    return { count: result.songs.length };
  });
  
  if (testData.artistId) {
    await test('Get Songs by Artist', async () => {
      const result = await makeRequest('GET', `/song?artistId=${testData.artistId}&page=1&limit=10`);
      if (!result.songs || !Array.isArray(result.songs)) {
        throw new Error('Invalid response format');
      }
      return { count: result.songs.length };
    });
  }
  
  if (testData.genreId) {
    await test('Get Songs by Genre', async () => {
      const result = await makeRequest('GET', `/song?genreId=${testData.genreId}&page=1&limit=10`);
      if (!result.songs || !Array.isArray(result.songs)) {
        throw new Error('Invalid response format');
      }
      return { count: result.songs.length };
    });
  }
  
  if (testData.songId) {
    await test('Get Specific Song', async () => {
      const result = await makeRequest('GET', `/song/${testData.songId}`);
      if (!result.song) {
        throw new Error('Song not found');
      }
      return { songId: result.song.SongID };
    });
    
    await test('Increment Listen Count', async () => {
      const result = await makeRequest('POST', `/song/${testData.songId}/increment-listen-count`);
      return result;
    });
  }
}

async function runPlaylistTests(): Promise<void> {
  console.log('\n📋 Playlist API Tests');
  console.log('='.repeat(60));
  
  await test('Get Public Playlists', async () => {
    const result = await makeRequest('GET', '/playlists?page=1&limit=10');
    if (!result.playlists || !Array.isArray(result.playlists)) {
      throw new Error('Invalid response format');
    }
    return { count: result.playlists.length };
  });
  
  await test('Get Top Playlists', async () => {
    const result = await makeRequest('GET', '/playlists/top');
    if (!result.playlists || !Array.isArray(result.playlists)) {
      throw new Error('Invalid response format');
    }
    return { count: result.playlists.length };
  });
  
  // Create Playlist Test
  if (testData.users.length > 0 && testData.users[0].token) {
    await test('Create Playlist', async () => {
      const playlistData = {
        playlistName: `Test Playlist ${Date.now()}`,
        description: 'Test playlist description',
        isPublic: true
      };
      
      const result = await makeRequest('POST', '/playlists', playlistData, testData.users[0].token);
      if (result.playlistId) {
        testData.playlistId = result.playlistId;
      }
      return { playlistId: result.playlistId };
    });
  }
  
  if (testData.playlistId) {
    await test('Get Specific Playlist', async () => {
      const result = await makeRequest('GET', `/playlists/${testData.playlistId}`);
      if (!result.playlist) {
        throw new Error('Playlist not found');
      }
      return { playlistId: result.playlist.PlaylistID };
    });
    
    await test('Get Playlist Songs', async () => {
      const result = await makeRequest('GET', `/playlists/${testData.playlistId}/songs`);
      if (!result.songs || !Array.isArray(result.songs)) {
        throw new Error('Invalid response format');
      }
      return { count: result.songs.length };
    });
    
    // Add song to playlist
    if (testData.songId && testData.users.length > 0 && testData.users[0].token) {
      await test('Add Song to Playlist', async () => {
        const result = await makeRequest('POST', `/playlists/${testData.playlistId}/songs`, {
          songId: testData.songId
        }, testData.users[0].token);
        return result;
      });
      
      await test('Remove Song from Playlist', async () => {
        const result = await makeRequest('DELETE', `/playlists/${testData.playlistId}/songs/${testData.songId}`, {}, testData.users[0].token);
        return result;
      });
    }
    
    // Update playlist
    if (testData.users.length > 0 && testData.users[0].token) {
      await test('Update Playlist', async () => {
        const updateData = {
          playlistName: `Updated Test Playlist ${Date.now()}`,
          description: 'Updated description'
        };
        
        const result = await makeRequest('PUT', `/playlists/${testData.playlistId}`, updateData, testData.users[0].token);
        return result;
      });
    }
    
    await test('Get Playlist Stats', async () => {
      const result = await makeRequest('GET', `/playlists/${testData.playlistId}/stats`);
      return result;
    });
  }
}

async function runUserTests(): Promise<void> {
  console.log('\n👥 User API Tests');
  console.log('='.repeat(60));
  
  if (testData.users.length > 0) {
    const userId = testData.users[0].id;
    
    await test('Get User by ID', async () => {
      const result = await makeRequest('GET', `/users/${userId}`);
      if (!result.user) {
        throw new Error('User not found');
      }
      return { userId: result.user.UserID };
    });
    
    await test('Search Users', async () => {
      const result = await makeRequest('GET', `/users/search?query=test&page=1&limit=10`);
      if (!result.users || !Array.isArray(result.users)) {
        throw new Error('Invalid response format');
      }
      return { count: result.users.length };
    });
    
    if (testData.users[0].token) {
      await test('Update User Profile', async () => {
        const updateData = {
          firstName: 'Updated',
          lastName: 'Name',
          city: 'New City'
        };
        
        const result = await makeRequest('PUT', `/users/${userId}`, updateData, testData.users[0].token);
        return result;
      });
      
      await test('Get User Liked Songs', async () => {
        const result = await makeRequest('GET', `/users/${userId}/liked-songs`, {}, testData.users[0].token);
        if (!result.songs || !Array.isArray(result.songs)) {
          throw new Error('Invalid response format');
        }
        return { count: result.songs.length };
      });
      
      await test('Get User Following', async () => {
        const result = await makeRequest('GET', `/users/${userId}/following`, {}, testData.users[0].token);
        if (!result.following || !Array.isArray(result.following)) {
          throw new Error('Invalid response format');
        }
        return { count: result.following.length };
      });
      
      await test('Get User History', async () => {
        const result = await makeRequest('GET', `/users/${userId}/history`, {}, testData.users[0].token);
        if (!result.history || !Array.isArray(result.history)) {
          throw new Error('Invalid response format');
        }
        return { count: result.history.length };
      });
    }
  }
}

async function runSocialTests(): Promise<void> {
  console.log('\n💝 Social Features Tests');
  console.log('='.repeat(60));
  
  if (testData.users.length > 0 && testData.users[0].token && testData.songId) {
    await test('Like Song', async () => {
      const result = await makeRequest('POST', '/likes/songs', {
        songId: testData.songId
      }, testData.users[0].token);
      return result;
    });
    
    await test('Check Song Like Status', async () => {
      const result = await makeRequest('GET', `/likes/songs/${testData.users[0].id}/status/${testData.songId}`);
      return result;
    });
    
    await test('Unlike Song', async () => {
      const result = await makeRequest('DELETE', '/likes/songs', {
        songId: testData.songId
      }, testData.users[0].token);
      return result;
    });
  }
  
  if (testData.users.length > 0 && testData.users[0].token && testData.albumId) {
    await test('Like Album', async () => {
      const result = await makeRequest('POST', '/likes/albums', {
        albumId: testData.albumId
      }, testData.users[0].token);
      return result;
    });
    
    await test('Unlike Album', async () => {
      const result = await makeRequest('DELETE', '/likes/albums', {
        albumId: testData.albumId
      }, testData.users[0].token);
      return result;
    });
  }
  
  if (testData.users.length > 1 && testData.users[0].token && testData.artistId) {
    await test('Follow Artist', async () => {
      const result = await makeRequest('POST', '/follows', {
        artistId: testData.artistId
      }, testData.users[0].token);
      return result;
    });
    
    await test('Check Follow Status', async () => {
      const result = await makeRequest('GET', `/users/${testData.users[0].id}/following/${testData.artistId}`);
      return result;
    });
    
    await test('Unfollow Artist', async () => {
      const result = await makeRequest('DELETE', '/follows', {
        artistId: testData.artistId
      }, testData.users[0].token);
      return result;
    });
  }
}

async function runAnalyticsTests(): Promise<void> {
  console.log('\n📊 Analytics & History Tests');
  console.log('='.repeat(60));
  
  await test('Get Trending Songs', async () => {
    const result = await makeRequest('GET', '/trending?days=7&limit=10');
    if (!result.songs || !Array.isArray(result.songs)) {
      throw new Error('Invalid response format');
    }
    return { count: result.songs.length };
  });
  
  if (testData.users.length > 0 && testData.users[0].token && testData.songId) {
    await test('Add to History', async () => {
      const historyData = {
        songId: testData.songId,
        listenDuration: 180
      };
      
      const result = await makeRequest('POST', '/history', historyData, testData.users[0].token);
      return result;
    });
  }
}

async function runSearchTests(): Promise<void> {
  console.log('\n🔍 Search Tests');
  console.log('='.repeat(60));
  
  await test('Universal Search', async () => {
    const result = await makeRequest('GET', '/search?query=test&limit=10');
    return result;
  });
}

async function runTests(): Promise<void> {
  console.log('\n🧪 Starting Comprehensive API Tests\n');
  console.log(`📍 Testing against: ${BASE_URL}\n`);
  console.log('='.repeat(80));
  
  try {
    await runHealthTests();
    await runAuthTests();
    await runGenreTests();
    await runArtistTests();
    await runAlbumTests();
    await runSongTests();
    await runPlaylistTests();
    await runUserTests();
    await runSocialTests();
    await runAnalyticsTests();
    await runSearchTests();
    
    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 Test Summary\n');
    
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`📈 Test Coverage: ${results.length} endpoints tested\n`);
    
    if (failed > 0) {
      console.log('Failed Tests:\n');
      results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  ❌ ${r.name}`);
          console.log(`     ${r.error}\n`);
        });
    }
    
    // Database statistics
    try {
      const pool = await createConnection();
      const [userRows] = await pool.query<any[]>("SELECT COUNT(*) as count FROM userprofile");
      const [songRows] = await pool.query<any[]>("SELECT COUNT(*) as count FROM song");
      const [albumRows] = await pool.query<any[]>("SELECT COUNT(*) as count FROM album");
      const [artistRows] = await pool.query<any[]>("SELECT COUNT(*) as count FROM artist");
      const [playlistRows] = await pool.query<any[]>("SELECT COUNT(*) as count FROM playlist");
      
      console.log('📊 Database Statistics:\n');
      console.log(`   Users: ${userRows[0].count}`);
      console.log(`   Songs: ${songRows[0].count}`);
      console.log(`   Albums: ${albumRows[0].count}`);
      console.log(`   Artists: ${artistRows[0].count}`);
      console.log(`   Playlists: ${playlistRows[0].count}\n`);
      
      await pool.end();
    } catch (error: any) {
      console.log(`\n⚠️  Could not fetch database statistics: ${error.message}\n`);
    }
    
  } finally {
    await cleanup();
  }
  
  const failed = results.filter(r => !r.success).length;
  process.exit(failed > 0 ? 1 : 0);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Test interrupted. Cleaning up...');
  await cleanup();
  process.exit(1);
});

// Run tests
runTests().catch(async (error) => {
  console.error('\n💥 Fatal error:', error);
  await cleanup();
  process.exit(1);
});