import { HttpClientPort } from './http-client.port';
import { defaultHttpClient } from './axios-http-client.adapter';

export class CampaignApiAdapter {
  constructor(private client: HttpClientPort = defaultHttpClient) {}

  async getProjects(params?: Record<string, string | number | boolean>) {
    return this.client.get('/user-projects', { params });
  }

  async getPublicProjects(params?: Record<string, string | number | boolean>) {
    return this.client.get('/user-projects/public', { params });
  }

  async getProjectById(id: string) {
    return this.client.get(`/user-projects/${id}`);
  }

  async createProject(data: FormData | Record<string, unknown>) {
    return this.client.post('/user-projects', data);
  }

  async updateProject(id: string, data: FormData | Record<string, unknown>) {
    return this.client.patch(`/user-projects/${id}`, data);
  }

  async deleteProject(id: string) {
    return this.client.delete(`/user-projects/${id}`);
  }
}

export const campaignApiAdapter = new CampaignApiAdapter();
