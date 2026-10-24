export interface HttpRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  skipCache?: boolean;
}

export interface HttpClientPort {
  get<T>(endpoint: string, options?: HttpRequestOptions): Promise<T>;
  post<T>(endpoint: string, body?: unknown, options?: HttpRequestOptions): Promise<T>;
  put<T>(endpoint: string, body?: unknown, options?: HttpRequestOptions): Promise<T>;
  patch<T>(endpoint: string, body?: unknown, options?: HttpRequestOptions): Promise<T>;
  delete<T>(endpoint: string, options?: HttpRequestOptions): Promise<T>;
}
