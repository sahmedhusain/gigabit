// Import all modules to ensure they extend the ApiClient
import './auth';
import './posts';
import './groups';
import './events';
import './polls';
import './messages';
import './notifications';
import './users';
import './shares';

// Export the API client instance and utilities
export { api, API_BASE_URL, getToken, setToken, removeToken, isAuthenticated, logoutUser, handleSessionExpired, ApiClient } from './client';

// Export all types
export * from './types';