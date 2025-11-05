import { loginApi } from './api';

// Login tracking service
// Tracks user activities and handles logout scenarios (idle timeout, page unload, explicit logout)

const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour in milliseconds
let idleTimer: NodeJS.Timeout | null = null;
let lastActivityTime = Date.now();
let isTracking = false;
let currentUserId: number | null = null;

// Activity tracking counters
let activityCounters = {
  songsPlayed: 0,
  songsLiked: 0,
  artistsFollowed: 0,
  songsUploaded: 0
};

// Reset idle timer
function resetIdleTimer() {
  if (idleTimer) {
    clearTimeout(idleTimer);
  }
  
  lastActivityTime = Date.now();
  
  // Set new timeout
  idleTimer = setTimeout(() => {
    handleIdleTimeout();
  }, IDLE_TIMEOUT_MS);
}

// Handle idle timeout - logout the user
async function handleIdleTimeout() {
  if (currentUserId) {
    console.log('User idle for 1 hour, logging out session...');
    try {
      await loginApi.logout(currentUserId);
      // Note: We don't clear localStorage or redirect here - that's handled by the AuthContext
      // This just records the logout in the database
    } catch (error) {
      console.error('Error logging out idle session:', error);
    }
  }
  stopTracking();
}

// Track user activity
export function trackActivity(userId: number) {
  if (!isTracking || currentUserId !== userId) {
    return;
  }
  
  resetIdleTimer();
}

// Increment activity counters
export function incrementActivity(
  type: 'songsPlayed' | 'songsLiked' | 'artistsFollowed' | 'songsUploaded',
  count: number = 1
) {
  if (!isTracking || !currentUserId) {
    return;
  }

  activityCounters[type] += count;
  
  // Update on server (debounced - update every 5 seconds or on logout)
  updateActivityOnServer();
}

// Update activity on server (debounced)
let updateActivityTimeout: NodeJS.Timeout | null = null;
function updateActivityOnServer() {
  if (updateActivityTimeout) {
    clearTimeout(updateActivityTimeout);
  }

  updateActivityTimeout = setTimeout(async () => {
    if (currentUserId && isTracking) {
      try {
        await loginApi.updateActivity(currentUserId, activityCounters);
        // Reset counters after successful update
        activityCounters = {
          songsPlayed: 0,
          songsLiked: 0,
          artistsFollowed: 0,
          songsUploaded: 0
        };
      } catch (error) {
        console.error('Error updating login activity:', error);
      }
    }
  }, 5000); // Update every 5 seconds
}

// Start tracking login session
export function startTracking(userId: number) {
  if (isTracking && currentUserId === userId) {
    return; // Already tracking this user
  }

  // Stop previous tracking if any
  stopTracking();

  currentUserId = userId;
  isTracking = true;
  lastActivityTime = Date.now();
  
  // Reset counters
  activityCounters = {
    songsPlayed: 0,
    songsLiked: 0,
    artistsFollowed: 0,
    songsUploaded: 0
  };

  // Set up idle timer
  resetIdleTimer();

  // Set up activity listeners
  setupActivityListeners();

  // Set up page unload handler
  setupPageUnloadHandler();

  console.log('Login tracking started for user:', userId);
}

// Stop tracking
export async function stopTracking(sendLogout: boolean = true) {
  if (!isTracking || !currentUserId) {
    return;
  }

  // Clear idle timer
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }

  // Clear update timeout
  if (updateActivityTimeout) {
    clearTimeout(updateActivityTimeout);
    updateActivityTimeout = null;
  }

  // Send final activity update and logout
  if (sendLogout && currentUserId) {
    try {
      // Send any pending activity updates
      if (Object.values(activityCounters).some(v => v > 0)) {
        await loginApi.updateActivity(currentUserId, activityCounters);
      }
      // Logout the session
      await loginApi.logout(currentUserId);
    } catch (error) {
      console.error('Error during logout tracking:', error);
    }
  }

  // Remove activity listeners
  removeActivityListeners();
  removePageUnloadHandler();

  isTracking = false;
  currentUserId = null;
  activityCounters = {
    songsPlayed: 0,
    songsLiked: 0,
    artistsFollowed: 0,
    songsUploaded: 0
  };

  console.log('Login tracking stopped');
}

// Set up activity listeners (mouse, keyboard, scroll, etc.)
function setupActivityListeners() {
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  events.forEach(event => {
    document.addEventListener(event, () => trackActivity(currentUserId!), true);
  });
}

// Remove activity listeners
function removeActivityListeners() {
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  events.forEach(event => {
    document.removeEventListener(event, () => trackActivity(currentUserId!), true);
  });
}

// Set up page unload handler
function setupPageUnloadHandler() {
  window.addEventListener('beforeunload', handlePageUnload);
  window.addEventListener('pagehide', handlePageUnload);
}

// Remove page unload handler
function removePageUnloadHandler() {
  window.removeEventListener('beforeunload', handlePageUnload);
  window.removeEventListener('pagehide', handlePageUnload);
}

// Handle page unload - logout the session
async function handlePageUnload() {
  if (isTracking && currentUserId) {
    // Use sendBeacon for reliable delivery during page unload
    const data = JSON.stringify({ 
      userId: currentUserId,
      ...activityCounters 
    });
    
    // Try to send logout via beacon (if supported)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/login/logout`,
        new Blob([data], { type: 'application/json' })
      );
    } else {
      // Fallback: send synchronously (not ideal but works)
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/login/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true // This helps ensure the request completes
        });
      } catch (error) {
        console.error('Error logging out on page unload:', error);
      }
    }
  }
}

