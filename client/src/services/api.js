import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL,
  withCredentials: false,
});

let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token;
  if (token) localStorage.setItem('pathaura_token', token);
  else localStorage.removeItem('pathaura_token');
}

export function readStoredToken() {
  return localStorage.getItem('pathaura_token');
}

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

api.interceptors.request.use((config) => {
  const token = authToken || readStoredToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(normalizeError(error));
  }
);

export function normalizeError(error) {
  const body = error.response?.data?.error;
  const message = body?.message || error.message || 'Something went wrong.';
  const err = new Error(message);
  err.code = body?.code || 'network_error';
  err.status = error.response?.status || 0;
  err.details = body?.details;
  return err;
}
