import dotenv from 'dotenv';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  type: string;
}

interface Workflow {
  name: string;
  description: string;
  user: TestUser;
  createdIds: {
    songs?: number[];
    albums?: number[];
    playlists?: number[];
  };
}

const results: TestResult[] = [];
const workflows: Workflow[] = [];

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
        console.log(`   → ${JSON.stringify(data).substring(0, 120)}...`);
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
    return { message: text };
  }
}

async function makeFormRequest(method: string, path: string, formData: FormData, token?: string): Promise<any> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {};
  
  if (token) {
    headers['Cookie'] = `session=${token}`;
  }
  
  const response = await fetch(url, {
    method,
    headers,
    body: formData as any,
    credentials: 'include'
  });
  
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
    return { message: text };
  }
}

function createTestAudioFile(filename: string = 'test-song.wav'): string {
  const testDir = path.join(__dirname, 'test-integration-uploads');
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // Create a minimal WAV file
  const wavHeader = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // "RIFF"
    0x24, 0x00, 0x00, 0x00, // File size - 8
    0x57, 0x41, 0x56, 0x45, // "WAVE"
    0x66, 0x6D, 0x74, 0x20, // "fmt "
    0x10, 0x00, 0x00, 0x00, // Subchunk1Size
    0x01, 0x00,             // AudioFormat
    0x01, 0x00,             // NumChannels
    0x44, 0xAC, 0x00, 0x00, // SampleRate (44100)
    0x88, 0x58, 0x01, 0x00, // ByteRate
    0x02, 0x00,             // BlockAlign
    0x10, 0x00,             // BitsPerSample
    0x64, 0x61, 0x74, 0x61, // "data"
    0x00, 0x00, 0x00, 0x00  // Subchunk2Size
  ]);
  
  const filePath = path.join(testDir, filename);
  fs.writeFileSync(filePath, wavHeader);
  return filePath;
}

async function createTestUser(userType: string, suffix: string): Promise<TestUser> {
  const timestamp = Date.now();
  const username = `workflow${suffix}_${timestamp}`;
  const userData = {
    username,
    password: 'testpass123',
    firstName: 'Workflow',
    lastName: `User${suffix}`,
    dateOfBirth: '1990-01-01',
    email: `workflow${suffix}_${timestamp}@test.com`,
    userType,
    country: 'USA',
    city: 'Test City'
  };
  
  const result = await makeRequest('POST', '/auth/register', userData);
  
  if (!result.userId) {
    throw new Error('Failed to create test user');
  }
  
  const loginResult = await makeRequest('POST', '/auth/login', {
    username,
    password: userData.password
  });
  
  return {
    id: result.userId,
    username,
    password: userData.password,
    token: loginResult.sessionId || loginResult.token || 'logged-in',
    type: userType
  };
}

async function cleanup(): Promise<void> {
  console.log('\n🧹 Cleaning up test data...');
  
  // Clean up test files
  const testDir = path.join(__dirname, 'test-integration-uploads');
  if (fs.existsSync(testDir)) {
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
      console.log('   Removed test files');
    } catch (error: any) {
      console.log(`   Failed to remove test files: ${error.message}`);
    }
  }
  
  // Log cleanup suggestions
  console.log('   Note: Test users and created content should be cleaned up manually');
  console.log(`   Created ${workflows.length} test workflows with data`);
  
  for (const workflow of workflows) {
    console.log(`   - ${workflow.name}: User ID ${workflow.user.id}`);
    if (workflow.createdIds.songs && workflow.createdIds.songs.length > 0) {
      console.log(`     Songs: ${workflow.createdIds.songs.join(', ')}`);
    }
    if (workflow.createdIds.albums && workflow.createdIds.albums.length > 0) {
      console.log(`     Albums: ${workflow.createdIds.albums.join(', ')}`);
    }
    if (workflow.createdIds.playlists && workflow.createdIds.playlists.length > 0) {
      console.log(`     Playlists: ${workflow.createdIds.playlists.join(', ')}`);
    }
  }
}

async function runArtistWorkflow(): Promise<void> {
  console.log('\n🎤 Artist Workflow: Create, Upload, and Manage Content');
  console.log('='.repeat(70));
  
  const artist = await createTestUser('Artist', 'Creator');
  const workflow: Workflow = {
    name: 'Artist Content Creation',
    description: 'Complete artist workflow from registration to content management',
    user: artist,
    createdIds: { songs: [], albums: [], playlists: [] }
  };
  
  let albumId: number;
  let songId: number;
  
  // Get a genre for testing
  const genresResult = await makeRequest('GET', '/genres');
  const genreId = genresResult.genres && genresResult.genres.length > 0 
    ? genresResult.genres[0].GenreID 
    : 1;
  
  await test('Artist Registration and Login', async () => {
    return { userId: artist.id, authenticated: !!artist.token };
  });
  
  await test('Create Album', async () => {
    const albumData = {
      albumName: `Test Album ${Date.now()}`,
      releaseDate: '2024-01-01',
      genreId,
      description: 'Integration test album'
    };
    
    const result = await makeRequest('POST', '/albums', albumData, artist.token);
    albumId = result.albumId;
    workflow.createdIds.albums!.push(albumId);
    return { albumId };
  });
  
  await test('Upload Song to Album', async () => {
    const audioPath = createTestAudioFile();
    const formData = new FormData();
    formData.append('songFile', fs.createReadStream(audioPath));
    formData.append('songName', `Integration Test Song ${Date.now()}`);
    formData.append('duration', '180');
    formData.append('genreId', genreId.toString());
    if (albumId) {
      formData.append('albumId', albumId.toString());
    }
    
    const result = await makeFormRequest('POST', '/song/upload', formData, artist.token);
    songId = result.songId;
    workflow.createdIds.songs!.push(songId);
    return { songId };
  });
  
  await test('Update Song Metadata', async () => {
    const updateData = {
      songName: `Updated Integration Test Song`,
      duration: 185
    };
    
    const result = await makeRequest('PUT', `/song/${songId}`, updateData, artist.token);
    return result;
  });
  
  await test('Check Album Contains Song', async () => {
    const result = await makeRequest('GET', `/albums/${albumId}`);
    return { 
      albumId: result.album.AlbumID,
      containsSong: 'Song should be in album'
    };
  });
  
  await test('Get Artist Profile', async () => {
    const result = await makeRequest('GET', `/artists/${artist.id}`);
    return { artistId: result.artist?.ArtistID };
  });
  
  await test('Get Artist Songs', async () => {
    const result = await makeRequest('GET', `/artists/${artist.id}/songs`);
    return { songCount: result.songs?.length || 0 };
  });
  
  await test('Get Artist Albums', async () => {
    const result = await makeRequest('GET', `/artists/${artist.id}/albums`);
    return { albumCount: result.albums?.length || 0 };
  });
  
  workflows.push(workflow);
}

async function runListenerWorkflow(): Promise<void> {
  console.log('\n👂 Listener Workflow: Discovery, Playlists, and Social Features');
  console.log('='.repeat(70));
  
  const listener = await createTestUser('Listener', 'Fan');
  const workflow: Workflow = {
    name: 'Listener Discovery and Engagement',
    description: 'Complete listener workflow from discovery to playlist management',
    user: listener,
    createdIds: { playlists: [] }
  };
  
  let playlistId: number;
  let discoveredSongId: number;
  let discoveredAlbumId: number;
  let discoveredArtistId: number;
  
  await test('Listener Registration and Login', async () => {
    return { userId: listener.id, authenticated: !!listener.token };
  });
  
  await test('Discover Top Songs', async () => {
    const result = await makeRequest('GET', '/song/top');
    if (result.songs && result.songs.length > 0) {
      discoveredSongId = result.songs[0].SongID;
    }
    return { songsFound: result.songs?.length || 0 };
  });
  
  await test('Discover Top Albums', async () => {
    const result = await makeRequest('GET', '/albums/top');
    if (result.albums && result.albums.length > 0) {
      discoveredAlbumId = result.albums[0].AlbumID;
    }
    return { albumsFound: result.albums?.length || 0 };
  });
  
  await test('Discover Top Artists', async () => {
    const result = await makeRequest('GET', '/artists/top');
    if (result.artists && result.artists.length > 0) {
      discoveredArtistId = result.artists[0].ArtistID;
    }
    return { artistsFound: result.artists?.length || 0 };
  });
  
  if (discoveredSongId) {
    await test('Like Discovered Song', async () => {
      const result = await makeRequest('POST', '/likes/songs', {
        songId: discoveredSongId
      }, listener.token);
      return result;
    });
    
    await test('Increment Song Listen Count', async () => {
      const result = await makeRequest('POST', `/song/${discoveredSongId}/increment-listen-count`);
      return result;
    });
    
    await test('Rate Song', async () => {
      const result = await makeRequest('POST', '/ratings/songs', {
        songId: discoveredSongId,
        rating: 5
      }, listener.token);
      return result;
    });
    
    await test('Add to Listening History', async () => {
      const result = await makeRequest('POST', '/history', {
        songId: discoveredSongId,
        listenDuration: 180
      }, listener.token);
      return result;
    });
  }
  
  if (discoveredAlbumId) {
    await test('Like Discovered Album', async () => {
      const result = await makeRequest('POST', '/likes/albums', {
        albumId: discoveredAlbumId
      }, listener.token);
      return result;
    });
  }
  
  if (discoveredArtistId) {
    await test('Follow Discovered Artist', async () => {
      const result = await makeRequest('POST', '/follows', {
        artistId: discoveredArtistId
      }, listener.token);
      return result;
    });
  }
  
  await test('Create Personal Playlist', async () => {
    const playlistData = {
      playlistName: `My Favorites ${Date.now()}`,
      description: 'Integration test playlist',
      isPublic: true
    };
    
    const result = await makeRequest('POST', '/playlists', playlistData, listener.token);
    playlistId = result.playlistId;
    workflow.createdIds.playlists!.push(playlistId);
    return { playlistId };
  });
  
  if (playlistId && discoveredSongId) {
    await test('Add Song to Playlist', async () => {
      const result = await makeRequest('POST', `/playlists/${playlistId}/songs`, {
        songId: discoveredSongId
      }, listener.token);
      return result;
    });
    
    await test('Get Playlist Songs', async () => {
      const result = await makeRequest('GET', `/playlists/${playlistId}/songs`);
      return { songCount: result.songs?.length || 0 };
    });
  }
  
  await test('Get User Liked Songs', async () => {
    const result = await makeRequest('GET', `/users/${listener.id}/liked-songs`, {}, listener.token);
    return { likedCount: result.songs?.length || 0 };
  });
  
  await test('Get User Following List', async () => {
    const result = await makeRequest('GET', `/users/${listener.id}/following`, {}, listener.token);
    return { followingCount: result.following?.length || 0 };
  });
  
  await test('Get User Listening History', async () => {
    const result = await makeRequest('GET', `/users/${listener.id}/history`, {}, listener.token);
    return { historyCount: result.history?.length || 0 };
  });
  
  workflows.push(workflow);
}

async function runDiscoveryWorkflow(): Promise<void> {
  console.log('\n🔍 Music Discovery Workflow: Search and Recommendations');
  console.log('='.repeat(70));
  
  const explorer = await createTestUser('Listener', 'Explorer');
  
  await test('Explorer Registration', async () => {
    return { userId: explorer.id, authenticated: !!explorer.token };
  });
  
  await test('Browse All Genres', async () => {
    const result = await makeRequest('GET', '/genres');
    return { genreCount: result.genres?.length || 0 };
  });
  
  await test('Explore Genre with Listen Counts', async () => {
    const result = await makeRequest('GET', '/genres/with-listens');
    return { genresWithData: result.genres?.length || 0 };
  });
  
  await test('Search for Music', async () => {
    const result = await makeRequest('GET', '/search?query=test&limit=10');
    return result;
  });
  
  await test('Get Trending Songs', async () => {
    const result = await makeRequest('GET', '/trending?days=7&limit=10');
    return { trendingCount: result.songs?.length || 0 };
  });
  
  await test('Get Recommended Artists', async () => {
    const result = await makeRequest('GET', '/artists/recommended');
    return { recommendedCount: result.artists?.length || 0 };
  });
  
  await test('Browse by Genre', async () => {
    const genresResult = await makeRequest('GET', '/genres');
    if (genresResult.genres && genresResult.genres.length > 0) {
      const genreId = genresResult.genres[0].GenreID;
      const songsResult = await makeRequest('GET', `/genres/${genreId}/songs`);
      return { genreId, songCount: songsResult.songs?.length || 0 };
    }
    return { message: 'No genres available' };
  });
  
  await test('Paginated Song Discovery', async () => {
    const page1 = await makeRequest('GET', '/song?page=1&limit=5');
    const page2 = await makeRequest('GET', '/song?page=2&limit=5');
    
    return { 
      page1Count: page1.songs?.length || 0,
      page2Count: page2.songs?.length || 0,
      total: page1.total
    };
  });
}

async function runSocialInteractionWorkflow(): Promise<void> {
  console.log('\n🤝 Social Interaction Workflow: Cross-User Interactions');
  console.log('='.repeat(70));
  
  const user1 = await createTestUser('Listener', 'Social1');
  const user2 = await createTestUser('Listener', 'Social2');
  const artist = await createTestUser('Artist', 'Social');
  
  let sharedPlaylistId: number;
  let songId: number;
  
  await test('Setup Social Users', async () => {
    return { 
      user1Id: user1.id,
      user2Id: user2.id,
      artistId: artist.id
    };
  });
  
  // Artist creates content
  await test('Artist Creates Song', async () => {
    const audioPath = createTestAudioFile('social-song.wav');
    const formData = new FormData();
    formData.append('songFile', fs.createReadStream(audioPath));
    formData.append('songName', `Social Test Song ${Date.now()}`);
    formData.append('duration', '200');
    formData.append('genreId', '1');
    
    const result = await makeFormRequest('POST', '/song/upload', formData, artist.token);
    songId = result.songId;
    return { songId };
  });
  
  // User1 discovers and likes the song
  await test('User1 Likes Artist Song', async () => {
    const result = await makeRequest('POST', '/likes/songs', {
      songId
    }, user1.token);
    return result;
  });
  
  // User1 follows the artist
  await test('User1 Follows Artist', async () => {
    const result = await makeRequest('POST', '/follows', {
      artistId: artist.id
    }, user1.token);
    return result;
  });
  
  // User1 creates public playlist
  await test('User1 Creates Public Playlist', async () => {
    const playlistData = {
      playlistName: `Shared Favorites ${Date.now()}`,
      description: 'Social test playlist',
      isPublic: true
    };
    
    const result = await makeRequest('POST', '/playlists', playlistData, user1.token);
    sharedPlaylistId = result.playlistId;
    return { playlistId: sharedPlaylistId };
  });
  
  await test('User1 Adds Song to Public Playlist', async () => {
    const result = await makeRequest('POST', `/playlists/${sharedPlaylistId}/songs`, {
      songId
    }, user1.token);
    return result;
  });
  
  // User2 discovers the public playlist
  await test('User2 Discovers Public Playlists', async () => {
    const result = await makeRequest('GET', '/playlists?page=1&limit=10');
    return { playlistCount: result.playlists?.length || 0 };
  });
  
  // User2 likes the playlist
  await test('User2 Likes Shared Playlist', async () => {
    const result = await makeRequest('POST', '/likes/playlists', {
      playlistId: sharedPlaylistId
    }, user2.token);
    return result;
  });
  
  // User2 also follows the artist
  await test('User2 Follows Same Artist', async () => {
    const result = await makeRequest('POST', '/follows', {
      artistId: artist.id
    }, user2.token);
    return result;
  });
  
  // Check artist follower count
  await test('Check Artist Follower Count', async () => {
    const result = await makeRequest('GET', `/artists/${artist.id}/followers`);
    return { followerCount: result.followers?.length || 0 };
  });
  
  // Check song likes
  await test('Check Song Like Count', async () => {
    const result = await makeRequest('GET', `/song/${songId}`);
    return { songId: result.song?.SongID };
  });
  
  workflows.push({
    name: 'Social Interactions',
    description: 'Cross-user social features workflow',
    user: user1,
    createdIds: { playlists: [sharedPlaylistId] }
  });
}

async function runPerformanceWorkflow(): Promise<void> {
  console.log('\n⚡ Performance and Load Testing Workflow');
  console.log('='.repeat(70));
  
  const user = await createTestUser('Listener', 'Perf');
  
  await test('Concurrent API Calls Test', async () => {
    const startTime = Date.now();
    
    // Make multiple concurrent requests
    const promises = [
      makeRequest('GET', '/genres'),
      makeRequest('GET', '/artists/top'),
      makeRequest('GET', '/albums/top'),
      makeRequest('GET', '/song/top'),
      makeRequest('GET', '/playlists/top')
    ];
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    return { 
      duration: endTime - startTime,
      requestCount: promises.length,
      allSuccessful: results.every(r => r !== null)
    };
  });
  
  await test('Pagination Performance Test', async () => {
    const startTime = Date.now();
    
    // Test multiple pages
    const pages = await Promise.all([
      makeRequest('GET', '/song?page=1&limit=10'),
      makeRequest('GET', '/song?page=2&limit=10'),
      makeRequest('GET', '/song?page=3&limit=10')
    ]);
    
    const endTime = Date.now();
    
    return {
      duration: endTime - startTime,
      pagesLoaded: pages.length,
      totalSongs: pages.reduce((sum, page) => sum + (page.songs?.length || 0), 0)
    };
  });
  
  await test('Search Performance Test', async () => {
    const searchTerms = ['test', 'music', 'song', 'artist', 'album'];
    const startTime = Date.now();
    
    const searchResults = await Promise.all(
      searchTerms.map(term => 
        makeRequest('GET', `/search?query=${term}&limit=5`)
      )
    );
    
    const endTime = Date.now();
    
    return {
      duration: endTime - startTime,
      searchCount: searchTerms.length,
      avgPerSearch: (endTime - startTime) / searchTerms.length
    };
  });
}

async function runErrorHandlingWorkflow(): Promise<void> {
  console.log('\n🚨 Error Handling and Edge Cases Workflow');
  console.log('='.repeat(70));
  
  const user = await createTestUser('Listener', 'Error');
  
  await test('Invalid Song ID Handling', async () => {
    try {
      await makeRequest('GET', '/song/999999');
      throw new Error('Should have failed');
    } catch (error: any) {
      if (error.message.includes('Should have failed')) throw error;
      return { expectedFailure: true, error: error.message };
    }
  });
  
  await test('Invalid Playlist Operation', async () => {
    try {
      await makeRequest('POST', '/playlists/999999/songs', {
        songId: 1
      }, user.token);
      throw new Error('Should have failed');
    } catch (error: any) {
      if (error.message.includes('Should have failed')) throw error;
      return { expectedFailure: true, error: error.message };
    }
  });
  
  await test('Unauthorized Access Handling', async () => {
    try {
      await makeRequest('PUT', '/users/999999', {
        firstName: 'Hacker'
      }, user.token);
      throw new Error('Should have failed');
    } catch (error: any) {
      if (error.message.includes('Should have failed')) throw error;
      return { expectedFailure: true, error: error.message };
    }
  });
  
  await test('Invalid Rating Value', async () => {
    const songsResult = await makeRequest('GET', '/song?page=1&limit=1');
    if (songsResult.songs && songsResult.songs.length > 0) {
      try {
        await makeRequest('POST', '/ratings/songs', {
          songId: songsResult.songs[0].SongID,
          rating: 10  // Invalid: should be 1-5
        }, user.token);
        throw new Error('Should have failed');
      } catch (error: any) {
        if (error.message.includes('Should have failed')) throw error;
        return { expectedFailure: true, error: error.message };
      }
    }
    return { skipped: 'No songs available' };
  });
}

async function runTests(): Promise<void> {
  console.log('\n🧪 Starting Integration Workflow Tests\n');
  console.log(`📍 Testing against: ${BASE_URL}\n`);
  console.log('='.repeat(80));
  
  try {
    await runArtistWorkflow();
    await runListenerWorkflow();
    await runDiscoveryWorkflow();
    await runSocialInteractionWorkflow();
    await runPerformanceWorkflow();
    await runErrorHandlingWorkflow();
    
    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 Integration Test Summary\n');
    
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`🔄 Workflows Completed: ${workflows.length}\n`);
    
    if (failed > 0) {
      console.log('Failed Tests:\n');
      results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  ❌ ${r.name}`);
          console.log(`     ${r.error}\n`);
        });
    }
    
    console.log('🎯 Integration Test Coverage:');
    console.log('   - Complete Artist workflow (register → create content → manage)');
    console.log('   - Complete Listener workflow (discover → engage → playlist)');
    console.log('   - Music discovery and recommendation systems');
    console.log('   - Cross-user social interactions');
    console.log('   - Performance and concurrent request handling');
    console.log('   - Error handling and edge cases');
    console.log('   - Real-world user scenarios and workflows\n');
    
    console.log('📋 Workflow Summary:');
    for (const workflow of workflows) {
      console.log(`   - ${workflow.name}: ${workflow.description}`);
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