import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getSession } from 'next-auth/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const session: any = await getSession();
        if (session?.accessToken) {
          config.headers.Authorization = `Bearer ${session.accessToken}`;
        }
        if (session?.organizationId) {
          config.headers['X-Organization-Id'] = session.organizationId;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      },
    );
  }

  get<T = any>(url: string, params?: object): Promise<T> {
    return this.client.get<T>(url, { params }).then(r => r.data);
  }

  post<T = any>(url: string, data?: object): Promise<T> {
    return this.client.post<T>(url, data).then(r => r.data);
  }

  patch<T = any>(url: string, data?: object): Promise<T> {
    return this.client.patch<T>(url, data).then(r => r.data);
  }

  put<T = any>(url: string, data?: object): Promise<T> {
    return this.client.put<T>(url, data).then(r => r.data);
  }

  delete<T = any>(url: string): Promise<T> {
    return this.client.delete<T>(url).then(r => r.data);
  }
}

export const api = new ApiClient();
