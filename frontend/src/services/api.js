import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000, // 30s to handle Render cold starts
});

// Retry on cold start (503 or network error) — max 2 retries with backoff
const retryRequest = async (error) => {
  const config = error.config;
  if (!config || config.__retryCount >= 2) return Promise.reject(error);
  const isRetryable = !error.response || error.response.status === 503 || error.code === 'ECONNABORTED';
  if (!isRetryable) return Promise.reject(error);
  config.__retryCount = (config.__retryCount || 0) + 1;
  const delay = config.__retryCount * 2000; // 2s, 4s
  await new Promise((resolve) => setTimeout(resolve, delay));
  return api(config);
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => response, (error) => {
  // Retry on cold start before checking for auth errors
  if (!error.response || error.response.status === 503 || error.code === 'ECONNABORTED') {
    return retryRequest(error);
  }
  const expiredSession = error.response?.status === 401 && localStorage.getItem('token') && !error.config?.url?.includes('/auth/login');
  if (expiredSession) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (window.location.pathname !== '/') window.location.assign('/');
  }
  return Promise.reject(error);
});

export default api;

