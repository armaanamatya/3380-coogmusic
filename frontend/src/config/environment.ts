// Environment configuration for local development
// For production, set VITE_API_URL environment variable in your deployment platform

const getApiUrl = () => {
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    // For local development, use localhost:3001
    return 'http://localhost:3001';
  }
  
  // For production, use the environment variable
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};

export const API_BASE_URL = getApiUrl();

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  HEALTH: `${API_BASE_URL}/api/health`,
};

export default API_BASE_URL;
