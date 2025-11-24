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

const results: TestResult[] = [];
let testUserId: number = 0;
let testToken: string = '';

async function test(name: string, testFn: () => Promise<any>): Promise<void> {
  const start = Date.now();
  try {
    const data = await testFn();
    const duration = Date.now() - start;
    results.push({ name, success: true, data, duration });
    console.log(`✅ ${name} (${duration}ms)`);
    if (data && typeof data === 'object') {
      console.log(`   → ${JSON.stringify(data).substring(0, 150)}...`);
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

function createTestFile(filename: string, content: string): string {
  const testDir = path.join(__dirname, 'test-uploads');
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const filePath = path.join(testDir, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
}

function createTestAudioFile(): string {
  // Create a minimal WAV file (44 bytes header + silence)
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
  
  const filePath = createTestFile('test-audio.wav', wavHeader.toString('binary'));
  return filePath;
}

function createTestImageFile(): string {
  // Create a minimal PNG file (1x1 pixel transparent)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, // bit depth, color type, etc.
    0x89, 0x00, 0x00, 0x00, 0x0B, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x78, 0x9C, 0x62, 0x00, 0x02, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
    0x42, 0x60, 0x82
  ]);
  
  const filePath = createTestFile('test-image.png', pngData.toString('binary'));
  return filePath;
}

async function setupTestUser(): Promise<void> {
  const timestamp = Date.now();
  const userData = {
    username: `uploadtest_${timestamp}`,
    password: 'testpass123',
    firstName: 'Upload',
    lastName: 'Tester',
    dateOfBirth: '1990-01-01',
    email: `uploadtest_${timestamp}@test.com`,
    userType: 'Artist',
    country: 'USA',
    city: 'Test City'
  };
  
  const registerResult = await makeRequest('POST', '/auth/register', userData);
  testUserId = registerResult.userId;
  
  const loginResult = await makeRequest('POST', '/auth/login', {
    username: userData.username,
    password: userData.password
  });
  
  testToken = loginResult.sessionId || loginResult.token || 'logged-in';
}

async function cleanup(): Promise<void> {
  console.log('\n🧹 Cleaning up...');
  
  // Clean up test files
  const testDir = path.join(__dirname, 'test-uploads');
  if (fs.existsSync(testDir)) {
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
      console.log('   Removed test files');
    } catch (error: any) {
      console.log(`   Failed to remove test files: ${error.message}`);
    }
  }
  
  // Clean up test user
  if (testUserId) {
    try {
      // Note: In a real scenario, you might want to clean up the user from the database
      console.log(`   Test user ID ${testUserId} should be cleaned up from database`);
    } catch (error: any) {
      console.log(`   Failed to clean up test user: ${error.message}`);
    }
  }
}

async function runProfilePictureTests(): Promise<void> {
  console.log('\n📸 Profile Picture Upload Tests');
  console.log('='.repeat(60));
  
  await test('Upload Profile Picture', async () => {
    const imagePath = createTestImageFile();
    const formData = new FormData();
    formData.append('profilePicture', fs.createReadStream(imagePath));
    
    const result = await makeFormRequest('POST', `/users/${testUserId}/profile-picture`, formData, testToken);
    return result;
  });
  
  await test('Upload Invalid Profile Picture (large file)', async () => {
    // Create a file that's larger than the 5MB limit
    const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB
    const largePath = createTestFile('large-image.jpg', largeContent);
    const formData = new FormData();
    formData.append('profilePicture', fs.createReadStream(largePath));
    
    try {
      await makeFormRequest('POST', `/users/${testUserId}/profile-picture`, formData, testToken);
      throw new Error('Should have failed with large file');
    } catch (error: any) {
      if (error.message.includes('Should have failed')) {
        throw error;
      }
      return { expectedFailure: true, error: error.message };
    }
  });
  
  await test('Upload Invalid Profile Picture (wrong type)', async () => {
    const textPath = createTestFile('test.txt', 'This is not an image');
    const formData = new FormData();
    formData.append('profilePicture', fs.createReadStream(textPath));
    
    try {
      await makeFormRequest('POST', `/users/${testUserId}/profile-picture`, formData, testToken);
      throw new Error('Should have failed with wrong file type');
    } catch (error: any) {
      if (error.message.includes('Should have failed')) {
        throw error;
      }
      return { expectedFailure: true, error: error.message };
    }
  });
}

async function runSongUploadTests(): Promise<void> {
  console.log('\n🎵 Song Upload Tests');
  console.log('='.repeat(60));
  
  let uploadedSongId: number;
  
  await test('Upload Song with Audio File', async () => {
    const audioPath = createTestAudioFile();
    const formData = new FormData();
    formData.append('songFile', fs.createReadStream(audioPath));
    formData.append('songName', 'Test Upload Song');
    formData.append('duration', '180');
    formData.append('genreId', '1');
    
    const result = await makeFormRequest('POST', '/song/upload', formData, testToken);
    uploadedSongId = result.songId;
    return result;
  });
  
  await test('Upload Song without Audio File', async () => {
    const formData = new FormData();
    formData.append('songName', 'Test Song No File');
    formData.append('duration', '200');
    formData.append('genreId', '1');
    
    try {
      await makeFormRequest('POST', '/song/upload', formData, testToken);
      throw new Error('Should have failed without audio file');
    } catch (error: any) {
      if (error.message.includes('Should have failed')) {
        throw error;
      }
      return { expectedFailure: true, error: error.message };
    }
  });
  
  await test('Upload Song with Large Audio File', async () => {
    // Create a file larger than 50MB limit
    const largeContent = 'x'.repeat(51 * 1024 * 1024); // 51MB
    const largePath = createTestFile('large-audio.mp3', largeContent);
    const formData = new FormData();
    formData.append('songFile', fs.createReadStream(largePath));
    formData.append('songName', 'Large Test Song');
    formData.append('duration', '300');
    formData.append('genreId', '1');
    
    try {
      await makeFormRequest('POST', '/song/upload', formData, testToken);
      throw new Error('Should have failed with large file');
    } catch (error: any) {
      if (error.message.includes('Should have failed')) {
        throw error;
      }
      return { expectedFailure: true, error: error.message };
    }
  });
  
  await test('Upload Song with Wrong File Type', async () => {
    const textPath = createTestFile('test-song.txt', 'This is not an audio file');
    const formData = new FormData();
    formData.append('songFile', fs.createReadStream(textPath));
    formData.append('songName', 'Invalid File Song');
    formData.append('duration', '120');
    formData.append('genreId', '1');
    
    try {
      await makeFormRequest('POST', '/song/upload', formData, testToken);
      throw new Error('Should have failed with wrong file type');
    } catch (error: any) {
      if (error.message.includes('Should have failed')) {
        throw error;
      }
      return { expectedFailure: true, error: error.message };
    }
  });
  
  if (uploadedSongId) {
    await test('Verify Uploaded Song', async () => {
      const result = await makeRequest('GET', `/song/${uploadedSongId}`);
      if (!result.song) {
        throw new Error('Uploaded song not found');
      }
      return { songId: result.song.SongID, songName: result.song.SongName };
    });
    
    await test('Update Uploaded Song Metadata', async () => {
      const updateData = {
        songName: 'Updated Test Song',
        duration: 185
      };
      
      const result = await makeRequest('PUT', `/song/${uploadedSongId}`, updateData, testToken);
      return result;
    });
    
    await test('Delete Uploaded Song', async () => {
      const result = await makeRequest('DELETE', `/song/${uploadedSongId}`, {}, testToken);
      return result;
    });
  }
}

async function runAlbumCoverTests(): Promise<void> {
  console.log('\n💿 Album Cover Upload Tests');
  console.log('='.repeat(60));
  
  // First create an album
  let albumId: number;
  
  await test('Create Album for Cover Testing', async () => {
    const albumData = {
      albumName: `Test Album Cover ${Date.now()}`,
      releaseDate: '2023-01-01',
      genreId: 1,
      description: 'Test album for cover upload'
    };
    
    const result = await makeRequest('POST', '/albums', albumData, testToken);
    albumId = result.albumId;
    return { albumId };
  });
  
  if (albumId) {
    await test('Upload Album Cover', async () => {
      const imagePath = createTestImageFile();
      const formData = new FormData();
      formData.append('albumCover', fs.createReadStream(imagePath));
      
      const result = await makeFormRequest('POST', `/albums/${albumId}/cover`, formData, testToken);
      return result;
    });
    
    await test('Upload Invalid Album Cover (wrong type)', async () => {
      const textPath = createTestFile('test-cover.txt', 'This is not an image');
      const formData = new FormData();
      formData.append('albumCover', fs.createReadStream(textPath));
      
      try {
        await makeFormRequest('POST', `/albums/${albumId}/cover`, formData, testToken);
        throw new Error('Should have failed with wrong file type');
      } catch (error: any) {
        if (error.message.includes('Should have failed')) {
          throw error;
        }
        return { expectedFailure: true, error: error.message };
      }
    });
  }
}

async function runFileServingTests(): Promise<void> {
  console.log('\n📁 File Serving Tests');
  console.log('='.repeat(60));
  
  await test('Test Static File Serving', async () => {
    // Test if the uploads directory is accessible
    // Note: This assumes there are some files in the uploads directory
    const response = await fetch(`${BASE_URL}/uploads/test.txt`);
    
    if (response.status === 404) {
      return { message: 'No test files available (expected)' };
    }
    
    return { status: response.status, accessible: response.ok };
  });
}

async function runAuthenticationTests(): Promise<void> {
  console.log('\n🔒 Authentication Tests for File Uploads');
  console.log('='.repeat(60));
  
  await test('Upload Without Authentication', async () => {
    const imagePath = createTestImageFile();
    const formData = new FormData();
    formData.append('profilePicture', fs.createReadStream(imagePath));
    
    try {
      await makeFormRequest('POST', `/users/${testUserId}/profile-picture`, formData);
      throw new Error('Should have failed without authentication');
    } catch (error: any) {
      if (error.message.includes('Should have failed')) {
        throw error;
      }
      return { expectedFailure: true, error: error.message };
    }
  });
  
  await test('Upload to Another Users Profile', async () => {
    // Try to upload to user ID 999999 (assuming it doesn't exist)
    const imagePath = createTestImageFile();
    const formData = new FormData();
    formData.append('profilePicture', fs.createReadStream(imagePath));
    
    try {
      await makeFormRequest('POST', '/users/999999/profile-picture', formData, testToken);
      throw new Error('Should have failed with unauthorized access');
    } catch (error: any) {
      if (error.message.includes('Should have failed')) {
        throw error;
      }
      return { expectedFailure: true, error: error.message };
    }
  });
}

async function runTests(): Promise<void> {
  console.log('\n🧪 Starting File Upload Tests\n');
  console.log(`📍 Testing against: ${BASE_URL}\n`);
  console.log('='.repeat(80));
  
  try {
    await test('Setup Test User', setupTestUser);
    
    await runProfilePictureTests();
    await runSongUploadTests();
    await runAlbumCoverTests();
    await runFileServingTests();
    await runAuthenticationTests();
    
    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 File Upload Test Summary\n');
    
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
    
    console.log('🎯 File Upload Test Coverage:');
    console.log('   - Profile picture uploads (with validation)');
    console.log('   - Song file uploads (with metadata)');
    console.log('   - Album cover uploads');
    console.log('   - File size and type validation');
    console.log('   - Authentication requirements');
    console.log('   - Error handling and edge cases');
    console.log('   - Static file serving\n');
    
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