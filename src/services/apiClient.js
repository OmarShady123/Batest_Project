import axios from 'axios';

let accessToken = '';
let isRefreshing = false;
let refreshSubscribers = [];

const runtimeBaseURL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';

const apiClient = axios.create({
  // Production is served as a same-origin Vercel Service, so a missing VITE env
  // must never silently fall back to localhost in the user's browser.
  baseURL: import.meta.env.VITE_API_BASE_URL || runtimeBaseURL,
  withCredentials: true, // Sends HttpOnly refresh cookies
});

// Multi-tab refresh coordination using BroadcastChannel
const refreshChannel = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel('bastet_auth_refresh_channel') 
  : null;

if (refreshChannel) {
  refreshChannel.onmessage = (event) => {
    if (event.data?.type === 'REFRESH_SUCCESS' && event.data?.token) {
      setAccessToken(event.data.token);
      onRefreshed(event.data.token);
    } else if (event.data?.type === 'REFRESH_FAILED') {
      clearAccessToken();
      window.dispatchEvent(new Event('auth-logout'));
    }
  };
}

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// Request interceptor: attaches Bearer access token
apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor: auto-refresh token on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    
    // Do not attempt refresh on auth endpoints that are public or non-retryable
    const isPublicAuthRoute = 
      config?.url?.includes('/auth/login') ||
      config?.url?.includes('/auth/signup') ||
      config?.url?.includes('/auth/google') ||
      config?.url?.includes('/auth/forgot-password') ||
      config?.url?.includes('/auth/reset-password') ||
      config?.url?.includes('/auth/validate-reset-token') ||
      config?.url?.includes('/auth/verify-email') ||
      config?.url?.includes('/auth/resend-verification') ||
      config?.url?.includes('/auth/logout') ||
      config?.url?.includes('/auth/refresh');

    if (response?.status === 401 && !config._retry && !isPublicAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            config.headers['Authorization'] = `Bearer ${token}`;
            resolve(apiClient(config));
          });
        });
      }

      config._retry = true;
      isRefreshing = true;

      const performRefresh = async () => {
        try {
          const refreshResponse = await axios.post(
            `${apiClient.defaults.baseURL}/api/v1/auth/refresh`,
            {},
            { withCredentials: true }
          );
          const newToken = refreshResponse.data.access_token;
          setAccessToken(newToken);
          isRefreshing = false;
          onRefreshed(newToken);
          
          if (refreshChannel) {
            refreshChannel.postMessage({ type: 'REFRESH_SUCCESS', token: newToken });
          }

          config.headers['Authorization'] = `Bearer ${newToken}`;
          return apiClient(config);
        } catch (refreshError) {
          isRefreshing = false;
          clearAccessToken();
          if (refreshChannel) {
            refreshChannel.postMessage({ type: 'REFRESH_FAILED' });
          }
          window.dispatchEvent(new Event('auth-logout'));
          return Promise.reject(refreshError);
        }
      };

      // Use Web Locks API if available to coordinate multi-tab refresh
      if (typeof navigator !== 'undefined' && navigator.locks) {
        return navigator.locks.request('bastet_token_refresh_lock', async () => {
          return performRefresh();
        });
      } else {
        return performRefresh();
      }
    }

    return Promise.reject(error);
  }
);

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = '';
}

export default apiClient;
