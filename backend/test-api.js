import dotenv from 'dotenv';
import { createConnection, testConnection } from './src/database.js';
dotenv.config();
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:10000';
const API_BASE = `${BASE_URL}/api`;
const results = [];
async function test(name, testFn) {
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
        }
        else if (Array.isArray(data)) {
            console.log(`   → ${data.length} items returned`);
        }
    }
    catch (error) {
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
async function makeRequest(method, path, body, token) {
    const url = `${API_BASE}${path}`;
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const options = {
        method,
        headers,
    };
    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    const text = await response.text();
    try {
        const json = JSON.parse(text);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${json.error || text}`);
        }
        return json;
    }
    catch {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${text}`);
        }
        return text;
    }
}
async function runTests() {
    console.log('\n🧪 Starting API Tests\n');
    console.log(`📍 Testing against: ${BASE_URL}\n`);
    console.log('='.repeat(60));
    // Test database connection
    await test('Database Connection', async () => {
        const connected = await testConnection();
        if (!connected) {
            throw new Error('Database connection failed');
        }
        return { connected: true };
    });
    // Test health endpoint
    await test('Health Check', async () => {
        return await makeRequest('GET', '/health');
    });
    // Test database endpoint
    await test('Database Test Endpoint', async () => {
        return await makeRequest('GET', '/test-db');
    });
    // Test genres
    await test('Get All Genres', async () => {
        const result = await makeRequest('GET', '/genres');
        if (!result.genres || !Array.isArray(result.genres)) {
            throw new Error('Invalid response format');
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
    // Test artists
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
    // Test albums
    await test('Get All Albums', async () => {
        const result = await makeRequest('GET', '/albums');
        if (!result.albums || !Array.isArray(result.albums)) {
            throw new Error('Invalid response format');
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
    await test('Get Albums by Artist ID', async () => {
        const result = await makeRequest('GET', '/albums?artistId=1');
        if (!result.albums || !Array.isArray(result.albums)) {
            throw new Error('Invalid response format');
        }
        return { count: result.albums.length };
    });
    // Test songs
    await test('Get Top Songs', async () => {
        const result = await makeRequest('GET', '/song/top');
        if (!result.songs || !Array.isArray(result.songs)) {
            throw new Error('Invalid response format');
        }
        return { count: result.songs.length };
    });
    await test('Get Songs with Filters', async () => {
        const result = await makeRequest('GET', '/song?page=1&limit=10');
        if (!result.songs || !Array.isArray(result.songs)) {
            throw new Error('Invalid response format');
        }
        return { count: result.songs.length };
    });
    await test('Get Songs by Artist ID', async () => {
        const result = await makeRequest('GET', '/song?artistId=1&page=1&limit=10');
        if (!result.songs || !Array.isArray(result.songs)) {
            throw new Error('Invalid response format');
        }
        return { count: result.songs.length };
    });
    // Test playlists
    await test('Get Top Playlists', async () => {
        const result = await makeRequest('GET', '/playlists/top');
        if (!result.playlists || !Array.isArray(result.playlists)) {
            throw new Error('Invalid response format');
        }
        return { count: result.playlists.length };
    });
    await test('Get Public Playlists', async () => {
        const result = await makeRequest('GET', '/playlists?page=1&limit=10');
        if (!result.playlists || !Array.isArray(result.playlists)) {
            throw new Error('Invalid response format');
        }
        return { count: result.playlists.length };
    });
    // Test authentication
    let authToken = '';
    let testUserId = 0;
    await test('Register Test User', async () => {
        const timestamp = Date.now();
        const result = await makeRequest('POST', '/auth/register', {
            username: `testuser_${timestamp}`,
            password: 'testpass123',
            firstName: 'Test',
            lastName: 'User',
            dateOfBirth: '2000-01-01',
            email: `test_${timestamp}@test.com`,
            userType: 'Listener',
            country: 'USA',
            city: 'Test City'
        });
        if (result.userId) {
            testUserId = result.userId;
        }
        return { userId: result.userId };
    });
    await test('Login Test User', async () => {
        const timestamp = Date.now();
        // Try to login with the user we just created
        // If that fails, try a default test user
        try {
            const result = await makeRequest('POST', '/auth/login', {
                username: `testuser_${timestamp}`,
                password: 'testpass123'
            });
            authToken = result.token || '';
            return { loggedIn: true, token: authToken ? 'received' : 'none' };
        }
        catch {
            // Try default test user
            const result = await makeRequest('POST', '/auth/login', {
                username: 'test',
                password: 'test123'
            });
            authToken = result.token || '';
            return { loggedIn: true, token: authToken ? 'received' : 'none' };
        }
    });
    // Test user endpoints (if we have a token)
    if (testUserId > 0) {
        await test('Get User by ID', async () => {
            const result = await makeRequest('GET', `/users/${testUserId}`);
            if (!result.user) {
                throw new Error('User not found');
            }
            return { userId: result.user.UserID };
        });
    }
    // Test trending
    await test('Get Trending Songs', async () => {
        const result = await makeRequest('GET', '/trending?days=7&limit=10');
        if (!result.songs || !Array.isArray(result.songs)) {
            throw new Error('Invalid response format');
        }
        return { count: result.songs.length };
    });
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Test Summary\n');
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
    // Database statistics
    try {
        const pool = await createConnection();
        const [userRows] = await pool.query("SELECT COUNT(*) as count FROM userprofile");
        const [songRows] = await pool.query("SELECT COUNT(*) as count FROM song");
        const [albumRows] = await pool.query("SELECT COUNT(*) as count FROM album");
        const [artistRows] = await pool.query("SELECT COUNT(*) as count FROM artist");
        const [playlistRows] = await pool.query("SELECT COUNT(*) as count FROM playlist");
        console.log('📊 Database Statistics:\n');
        console.log(`   Users: ${userRows[0].count}`);
        console.log(`   Songs: ${songRows[0].count}`);
        console.log(`   Albums: ${albumRows[0].count}`);
        console.log(`   Artists: ${artistRows[0].count}`);
        console.log(`   Playlists: ${playlistRows[0].count}\n`);
        await pool.end();
    }
    catch (error) {
        console.log(`\n⚠️  Could not fetch database statistics: ${error.message}\n`);
    }
    process.exit(failed > 0 ? 1 : 0);
}
// Run tests
runTests().catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=test-api.js.map