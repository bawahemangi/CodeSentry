import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor for injecting auth token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 and logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend is offline or network error
    if (!error.response) {
      console.warn('[API] Backend connection unavailable or timed out. Falling back to simulated mode.');
    }
    return Promise.reject(error);
  }
);

/**
 * Health check helper to verify if Django backend is reachable
 */
export const checkBackendHealth = async () => {
  try {
    // Check repos endpoint with dummy installation_id or ping
    await axios.get(`${API_BASE_URL}/repos/?installation_id=0`, { timeout: 3000 });
    return { online: true, message: 'Django REST API connected' };
  } catch (err) {
    if (err.response && (err.response.status === 400 || err.response.status === 404 || err.response.status === 405)) {
      // Server responded with an HTTP code, meaning Django IS running!
      return { online: true, message: 'Django REST API connected' };
    }
    return { online: false, message: 'Backend unreachable (running in Demo Mode)' };
  }
};

export default api;
