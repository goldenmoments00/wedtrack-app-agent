import { SecureStorage } from './secure-storage';

export interface ApiErrorPayload {
  code: string;
  message: string;
  status: number;
  fieldErrors?: Record<string, string>;
}

export class ApiError extends Error {
  public code: string;
  public status: number;
  public fieldErrors?: Record<string, string>;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.code = payload.code;
    this.status = payload.status;
    this.fieldErrors = payload.fieldErrors;
  }
}

export interface RequestOptions extends RequestInit {
  idempotencyKey?: string;
  subdomain?: string;
}

class ApiClient {
  private baseUrl: string = process.env.EXPO_PUBLIC_API_URL || 'https://app.wedtrack.com';
  private onUnauthorizedCallback?: () => void;

  public setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setOnUnauthorized(callback: () => void) {
    this.onUnauthorizedCallback = callback;
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = await SecureStorage.getItem('auth_token');
    const storedSubdomain = await SecureStorage.getItem('studio_subdomain');
    const subdomain = options.subdomain || storedSubdomain;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (subdomain) {
      headers['x-tenant-subdomain'] = subdomain;
    }

    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401 || response.status === 403) {
        if (this.onUnauthorizedCallback) {
          this.onUnauthorizedCallback();
        }
      }

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText || 'Unknown network error' };
        }

        throw new ApiError({
          code: errorData.code || `HTTP_${response.status}`,
          message: errorData.message || errorData.error || `Server responded with status ${response.status}`,
          status: response.status,
          fieldErrors: errorData.fieldErrors,
        });
      }

      // 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError({
        code: 'NETWORK_FAILURE',
        message: err.message || 'Network request failed. Please check your connection.',
        status: 0,
      });
    }
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
