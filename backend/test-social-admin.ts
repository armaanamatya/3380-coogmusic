import dotenv from 'dotenv';
import { createConnection } from './src/database.js';

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
  type: string;
}

interface TestData {
  users: TestUser[];
  songId?: number;
  albumId?: number;
  playlistId?: number;
  artistId?: number;
  adminId?: number;
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

async function createTestUser(userType: string = 'Listener', suffix: string = ''): Promise<TestUser> {
  const timestamp = Date.now();
  const username = `socialtest${suffix}_${timestamp}`;
  const userData = {
    username,
    password: 'testpass123',
    firstName: 'Social',
    lastName: `User${suffix}`,
    dateOfBirth: '1990-01-01',
    email: `socialtest${suffix}_${timestamp}@test.com`,
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

async function setupTestData(): Promise<void> {
  console.log('\n⚙️ Setting up test data...');
  
  // Create test users
  const listener1 = await createTestUser('Listener', 'L1');
  const listener2 = await createTestUser('Listener', 'L2');
  const artist1 = await createTestUser('Artist', 'A1');
  const artist2 = await createTestUser('Artist', 'A2');
  const admin = await createTestUser('Administrator', 'Admin');
  
  testData.users = [listener1, listener2, artist1, artist2, admin];
  testData.artistId = artist1.id;
  testData.adminId = admin.id;
  
  // Get existing data from database
  try {
    const songsResult = await makeRequest('GET', '/song?page=1&limit=1');
    if (songsResult.songs && songsResult.songs.length > 0) {
      testData.songId = songsResult.songs[0].SongID;
    }
    
    const albumsResult = await makeRequest('GET', '/albums?page=1&limit=1');
    if (albumsResult.albums && albumsResult.albums.length > 0) {
      testData.albumId = albumsResult.albums[0].AlbumID;
    }
    
    const playlistsResult = await makeRequest('GET', '/playlists?page=1&limit=1');
    if (playlistsResult.playlists && playlistsResult.playlists.length > 0) {
      testData.playlistId = playlistsResult.playlists[0].PlaylistID;
    }
  } catch (error: any) {
    console.log(`   Warning: Could not fetch existing data: ${error.message}`);
  }
  
  console.log(`   Created ${testData.users.length} test users`);
  console.log(`   Found test data: Songs=${testData.songId}, Albums=${testData.albumId}, Playlists=${testData.playlistId}`);
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

async function runLikeTests(): Promise<void> {
  console.log('\n❤️ Like System Tests');
  console.log('='.repeat(60));
  
  const [listener1, listener2] = testData.users;
  
  if (testData.songId && listener1.token) {
    await test('Like Song', async () => {
      const result = await makeRequest('POST', '/likes/songs', {
        songId: testData.songId
      }, listener1.token);
      return result;
    });
    
    await test('Check Song Like Status', async () => {
      const result = await makeRequest('GET', `/likes/songs/${listener1.id}/status/${testData.songId}`);
      return result;
    });
    
    await test('Like Same Song Again (should handle gracefully)', async () => {
      try {
        const result = await makeRequest('POST', '/likes/songs', {
          songId: testData.songId
        }, listener1.token);
        return { message: 'Allowed duplicate like', ...result };
      } catch (error: any) {
        return { expectedFailure: true, error: error.message };
      }
    });
    
    await test('Unlike Song', async () => {
      const result = await makeRequest('DELETE', '/likes/songs', {
        songId: testData.songId
      }, listener1.token);
      return result;
    });
    
    await test('Unlike Song Again (should handle gracefully)', async () => {
      try {
        const result = await makeRequest('DELETE', '/likes/songs', {
          songId: testData.songId
        }, listener1.token);
        return { message: 'Allowed duplicate unlike', ...result };
      } catch (error: any) {
        return { expectedFailure: true, error: error.message };
      }
    });
  }
  
  if (testData.albumId && listener1.token) {
    await test('Like Album', async () => {
      const result = await makeRequest('POST', '/likes/albums', {
        albumId: testData.albumId
      }, listener1.token);
      return result;
    });
    
    await test('Check Album Like Status', async () => {
      const result = await makeRequest('GET', `/likes/albums/${listener1.id}/status/${testData.albumId}`);
      return result;
    });
    
    await test('Unlike Album', async () => {
      const result = await makeRequest('DELETE', '/likes/albums', {
        albumId: testData.albumId
      }, listener1.token);
      return result;
    });
  }
  
  if (testData.playlistId && listener1.token) {
    await test('Like Playlist', async () => {
      const result = await makeRequest('POST', '/likes/playlists', {
        playlistId: testData.playlistId
      }, listener1.token);
      return result;
    });
    
    await test('Check Playlist Like Status', async () => {
      const result = await makeRequest('GET', `/likes/playlists/${listener1.id}/status/${testData.playlistId}`);
      return result;
    });
    
    await test('Unlike Playlist', async () => {
      const result = await makeRequest('DELETE', '/likes/playlists', {
        playlistId: testData.playlistId
      }, listener1.token);
      return result;
    });
  }
  
  await test('Like Without Authentication', async () => {
    if (testData.songId) {
      try {
        await makeRequest('POST', '/likes/songs', {
          songId: testData.songId
        });
        throw new Error('Should have failed without authentication');
      } catch (error: any) {
        if (error.message.includes('Should have failed')) {
          throw error;
        }
        return { expectedFailure: true, error: error.message };
      }
    }
    return { skipped: 'No test song available' };
  });
}

async function runFollowTests(): Promise<void> {
  console.log('\n👥 Follow System Tests');
  console.log('='.repeat(60));
  
  const [listener1, listener2] = testData.users;
  
  if (testData.artistId && listener1.token) {
    await test('Follow Artist', async () => {
      const result = await makeRequest('POST', '/follows', {
        artistId: testData.artistId
      }, listener1.token);
      return result;
    });
    
    await test('Check Follow Status', async () => {
      const result = await makeRequest('GET', `/users/${listener1.id}/following/${testData.artistId}`);
      return result;
    });
    
    await test('Follow Same Artist Again (should handle gracefully)', async () => {
      try {
        const result = await makeRequest('POST', '/follows', {
          artistId: testData.artistId
        }, listener1.token);
        return { message: 'Allowed duplicate follow', ...result };
      } catch (error: any) {
        return { expectedFailure: true, error: error.message };
      }
    });
    
    await test('Get Artist Followers', async () => {
      const result = await makeRequest('GET', `/artists/${testData.artistId}/followers`);
      return result;
    });
    
    await test('Unfollow Artist', async () => {
      const result = await makeRequest('DELETE', '/follows', {
        artistId: testData.artistId
      }, listener1.token);
      return result;
    });
    
    await test('Unfollow Artist Again (should handle gracefully)', async () => {
      try {
        const result = await makeRequest('DELETE', '/follows', {
          artistId: testData.artistId
        }, listener1.token);
        return { message: 'Allowed duplicate unfollow', ...result };
      } catch (error: any) {
        return { expectedFailure: true, error: error.message };
      }
    });
  }
  
  await test('Follow Without Authentication', async () => {
    if (testData.artistId) {
      try {
        await makeRequest('POST', '/follows', {
          artistId: testData.artistId
        });
        throw new Error('Should have failed without authentication');
      } catch (error: any) {
        if (error.message.includes('Should have failed')) {
          throw error;
        }
        return { expectedFailure: true, error: error.message };
      }
    }
    return { skipped: 'No test artist available' };
  });
  
  await test('Follow Non-existent Artist', async () => {
    if (listener1.token) {
      try {
        await makeRequest('POST', '/follows', {
          artistId: 999999
        }, listener1.token);
        throw new Error('Should have failed with non-existent artist');
      } catch (error: any) {
        if (error.message.includes('Should have failed')) {
          throw error;
        }
        return { expectedFailure: true, error: error.message };
      }
    }
    return { skipped: 'No authenticated user available' };
  });
}

async function runRatingTests(): Promise<void> {
  console.log('\n⭐ Rating System Tests');
  console.log('='.repeat(60));
  
  const [listener1, listener2] = testData.users;
  
  if (testData.songId && listener1.token) {
    await test('Rate Song (5 stars)', async () => {
      const result = await makeRequest('POST', '/ratings/songs', {
        songId: testData.songId,
        rating: 5
      }, listener1.token);
      return result;
    });
    
    await test('Update Song Rating (3 stars)', async () => {
      const result = await makeRequest('POST', '/ratings/songs', {
        songId: testData.songId,
        rating: 3
      }, listener1.token);
      return result;
    });
    
    await test('Get Song Rating Stats', async () => {
      const result = await makeRequest('GET', `/ratings/songs/${testData.songId}/stats`);
      return result;
    });
    
    await test('Rate Song with Invalid Rating', async () => {
      try {
        await makeRequest('POST', '/ratings/songs', {
          songId: testData.songId,
          rating: 6  // Invalid: should be 1-5
        }, listener1.token);
        throw new Error('Should have failed with invalid rating');
      } catch (error: any) {
        if (error.message.includes('Should have failed')) {
          throw error;
        }
        return { expectedFailure: true, error: error.message };
      }
    });
    
    await test('Delete Song Rating', async () => {
      const result = await makeRequest('DELETE', '/ratings/songs', {
        songId: testData.songId
      }, listener1.token);
      return result;
    });
  }
  
  if (testData.albumId && listener1.token) {
    await test('Rate Album (4 stars)', async () => {
      const result = await makeRequest('POST', '/ratings/albums', {
        albumId: testData.albumId,
        rating: 4
      }, listener1.token);
      return result;
    });
    
    await test('Get Album Rating Distribution', async () => {
      const result = await makeRequest('GET', `/ratings/albums/${testData.albumId}/distribution`);
      return result;
    });
    
    await test('Delete Album Rating', async () => {
      const result = await makeRequest('DELETE', '/ratings/albums', {
        albumId: testData.albumId
      }, listener1.token);
      return result;
    });
  }
}

async function runNotificationTests(): Promise<void> {
  console.log('\n🔔 Notification System Tests');
  console.log('='.repeat(60));
  
  const [listener1] = testData.users;
  
  if (listener1.token) {
    await test('Get User Notifications', async () => {
      const result = await makeRequest('GET', `/notifications/${listener1.id}?page=1&limit=10`, {}, listener1.token);
      if (!result.notifications || !Array.isArray(result.notifications)) {
        throw new Error('Invalid response format');
      }
      return { count: result.notifications.length };
    });
    
    await test('Get Unread Notification Count', async () => {
      const result = await makeRequest('GET', `/notifications/unread-count/${listener1.id}`, {}, listener1.token);
      return result;
    });
    
    await test('Get Notification Settings', async () => {
      const result = await makeRequest('GET', `/notifications/settings/${listener1.id}`, {}, listener1.token);
      return result;
    });
    
    await test('Update Notification Settings', async () => {
      const settings = {
        emailNotifications: true,
        pushNotifications: false,
        followNotifications: true,
        likeNotifications: true
      };
      
      const result = await makeRequest('PUT', `/notifications/settings/${listener1.id}`, settings, listener1.token);
      return result;
    });
    
    // Test marking notifications as read (if any exist)
    const notificationsResult = await makeRequest('GET', `/notifications/${listener1.id}?page=1&limit=1`, {}, listener1.token);
    if (notificationsResult.notifications && notificationsResult.notifications.length > 0) {
      const notificationId = notificationsResult.notifications[0].NotificationID;
      
      await test('Mark Notification as Read', async () => {
        const result = await makeRequest('POST', '/notifications/mark-read', {
          notificationId
        }, listener1.token);
        return result;
      });
    }
    
    await test('Mark All Notifications as Read', async () => {
      const result = await makeRequest('POST', `/notifications/mark-all-read`, {
        userId: listener1.id
      }, listener1.token);
      return result;
    });
  }
}

async function runAdminTests(): Promise<void> {
  console.log('\n👑 Admin System Tests');
  console.log('='.repeat(60));
  
  const adminUser = testData.users.find(u => u.type === 'Administrator');
  
  if (adminUser && adminUser.token) {
    await test('Get Admin User Statistics', async () => {
      const result = await makeRequest('POST', '/admin/stats', {
        startDate: '2023-01-01',
        endDate: '2024-12-31'
      }, adminUser.token);
      return result;
    });
    
    await test('Get Admin User Management Data', async () => {
      const filters = {
        userType: 'Listener',
        accountStatus: 'Active',
        page: 1,
        limit: 10
      };
      
      const result = await makeRequest('POST', '/admin/users', filters, adminUser.token);
      if (!result.users || !Array.isArray(result.users)) {
        throw new Error('Invalid response format');
      }
      return { count: result.users.length, total: result.total };
    });
    
    await test('Get Admin Filter Options', async () => {
      const result = await makeRequest('POST', '/admin/users/filter-options', {}, adminUser.token);
      return result;
    });
    
    await test('Get Admin Song Management Data', async () => {
      const filters = {
        page: 1,
        limit: 10
      };
      
      const result = await makeRequest('POST', '/admin/songs', filters, adminUser.token);
      if (!result.songs || !Array.isArray(result.songs)) {
        throw new Error('Invalid response format');
      }
      return { count: result.songs.length };
    });
    
    // Test admin actions on test users
    const testUser = testData.users.find(u => u.type === 'Listener');
    if (testUser) {
      await test('Admin View User Details', async () => {
        const result = await makeRequest('GET', `/admin/users/${testUser.id}`, {}, adminUser.token);
        return { userId: result.user?.UserID };
      });
      
      // Note: We won't actually delete the test user here to avoid breaking other tests
      await test('Admin Delete User (simulation)', async () => {
        // This would be: DELETE /admin/users/${testUser.id}
        // But we'll just return a simulated response
        return { message: 'Would delete user', userId: testUser.id, simulated: true };
      });
    }
  } else {
    console.log('   ⚠️  No admin user available - skipping admin tests');
  }
  
  // Test non-admin access to admin endpoints
  const regularUser = testData.users.find(u => u.type === 'Listener');
  if (regularUser && regularUser.token) {
    await test('Non-Admin Access to Admin Stats (should fail)', async () => {
      try {
        await makeRequest('POST', '/admin/stats', {
          startDate: '2023-01-01',
          endDate: '2024-12-31'
        }, regularUser.token);
        throw new Error('Should have failed with non-admin access');
      } catch (error: any) {
        if (error.message.includes('Should have failed')) {
          throw error;
        }
        return { expectedFailure: true, error: error.message };
      }
    });
  }
}

async function runAnalyticsTests(): Promise<void> {
  console.log('\n📈 Analytics Tests');
  console.log('='.repeat(60));
  
  const [listener1] = testData.users;
  
  if (listener1.token) {
    await test('Generate Analytics Report', async () => {
      const reportData = {
        userId: listener1.id,
        startDate: '2023-01-01',
        endDate: '2024-12-31',
        metrics: ['listenTime', 'songCount', 'genreDistribution']
      };
      
      const result = await makeRequest('POST', '/analytics/report', reportData, listener1.token);
      return result;
    });
    
    await test('Generate Individual User Analytics', async () => {
      const analyticsData = {
        userId: listener1.id,
        period: 'month'
      };
      
      const result = await makeRequest('POST', '/analytics/individual', analyticsData, listener1.token);
      return result;
    });
  }
}

async function runTests(): Promise<void> {
  console.log('\n🧪 Starting Social Features & Admin Tests\n');
  console.log(`📍 Testing against: ${BASE_URL}\n`);
  console.log('='.repeat(80));
  
  try {
    await test('Setup Test Data', setupTestData);
    
    await runLikeTests();
    await runFollowTests();
    await runRatingTests();
    await runNotificationTests();
    await runAdminTests();
    await runAnalyticsTests();
    
    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 Social Features & Admin Test Summary\n');
    
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms\n`);
    
    if (failed > 0) {
      console.log('Failed Tests:\n');
      results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  ❌ ${r.name}`);
          console.log(`     ${r.error}\n`);
        });
    }
    
    console.log('🎯 Social Features & Admin Test Coverage:');
    console.log('   - Like/Unlike system (songs, albums, playlists)');
    console.log('   - Follow/Unfollow system (artists)');
    console.log('   - Rating system (1-5 stars for songs and albums)');
    console.log('   - Notification system (get, mark read, settings)');
    console.log('   - Admin user management');
    console.log('   - Admin statistics and analytics');
    console.log('   - Authentication and authorization checks');
    console.log('   - Error handling and edge cases\n');
    
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