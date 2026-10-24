import { HttpClientPort } from './http-client.port';
import { defaultHttpClient } from './axios-http-client.adapter';

export class AuthApiAdapter {
  constructor(private client: HttpClientPort = defaultHttpClient) {}

  async login(credentials: { email: string; password: string }) {
    return this.client.post('/auth/login', credentials);
  }

  async register(payload: Record<string, unknown>) {
    return this.client.post('/auth/register', payload);
  }

  async verifyEmail(token: string) {
    return this.client.get('/auth/verify-email', { params: { token } });
  }

  async requestPasswordReset(email: string) {
    return this.client.post('/auth/forgot-password', { email });
  }

  async resetPassword(payload: { token: string; password: string }) {
    return this.client.post('/auth/reset-password', payload);
  }

  async getProfile() {
    return this.client.get('/users/me');
  }
}

export const authApiAdapter = new AuthApiAdapter();
