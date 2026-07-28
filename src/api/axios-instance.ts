import Axios from 'axios';
import type { AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth-store';

export const axiosInstance = Axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

const SAFE_METHODS = new Set(['get', 'head', 'options']);

const readCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

// Ensures the XSRF-TOKEN cookie exists before the first mutating request
export const bootstrapCsrf = () =>
  axiosInstance.get('/api/auth/csrf').catch((error: unknown) => {
    // without the cookie every mutating request 403s — the retry interceptor below recovers once
    console.warn('CSRF bootstrap failed, first mutating request may be rejected', error);
  });

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!SAFE_METHODS.has(config.method ?? 'get')) {
    const xsrfToken = readCookie('XSRF-TOKEN');
    if (xsrfToken) {
      config.headers['X-XSRF-TOKEN'] = xsrfToken;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: () => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  failedQueue = [];
};

// ponytail: orval generated some GETs with responseType 'blob' (missing OpenAPI schema).
// Parse JSON blobs back to objects here; remove once orval is regenerated with fixed spec.
axiosInstance.interceptors.response.use(async (response) => {
  if (response.data instanceof Blob && response.data.type === 'application/json') {
    response.data = JSON.parse(await response.data.text());
  }
  return response;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _csrfRetried?: boolean;
    };

    // CSRF cookie missing or expired (e.g. bootstrap failed at app start): re-bootstrap once and retry.
    // Server re-evaluates a genuine 403 (e.g. admin-only) and rejects again.
    if (
      error.response?.status === 403 &&
      !originalRequest._csrfRetried &&
      !SAFE_METHODS.has(originalRequest.method ?? 'get')
    ) {
      originalRequest._csrfRetried = true;
      try {
        await axiosInstance.get('/api/auth/csrf');
      } catch {
        return Promise.reject(error);
      }
      return axiosInstance(originalRequest);
    }

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => axiosInstance(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await refreshTokens();
      processQueue(null);
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// Cross-tab single-flight: only one tab refreshes at a time; the others wait
// and then send the already-rotated cookie (shared jar) instead of the stale one.
// ponytail: waiting tabs refresh once more with the fresh cookie — harmless extra
// rotation, avoids unobservable "did the other tab already refresh" checks on httpOnly cookies.
const refreshTokens = (): Promise<unknown> => {
  if (typeof navigator === 'undefined' || !navigator.locks) {
    return axiosInstance.post('/api/auth/refresh');
  }
  return navigator.locks.request('auth-refresh', () =>
    axiosInstance.post('/api/auth/refresh'),
  );
};

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  return axiosInstance({ ...config, ...options }).then(({ data }) => data);
};

export type ErrorType<T> = AxiosError<T>;
