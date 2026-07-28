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
export const bootstrapCsrf = () => axiosInstance.get('/api/auth/csrf').catch(() => {});

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
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

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
      await axiosInstance.post('/api/auth/refresh');
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

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  return axiosInstance({ ...config, ...options }).then(({ data }) => data);
};

export type ErrorType<T> = AxiosError<T>;
