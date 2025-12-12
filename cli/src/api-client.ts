// cli/src/api-client.ts
import axios, { AxiosInstance } from 'axios';
import { getApiUrl, getAuthHeader } from './config';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: getApiUrl(),
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth header to every request
    this.client.interceptors.request.use((config) => {
      const authHeader = getAuthHeader();
      config.headers = { ...config.headers, ...authHeader };
      return config;
    });
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(email: string, password: string, name?: string) {
    const response = await this.client.post('/auth/register', { email, password, name });
    return response.data;
  }

  // Workspaces
  async listWorkspaces() {
    const response = await this.client.get('/admin/workspaces');
    return response.data;
  }

  async createWorkspace(data: { name: string; slug: string; description?: string }) {
    const response = await this.client.post('/admin/workspaces', data);
    return response.data;
  }

  // APIs
  async listApis(workspaceId?: string) {
    const params = workspaceId ? { workspaceId } : {};
    const response = await this.client.get('/api-definitions', { params });
    return response.data;
  }

  async getApi(id: string) {
    const response = await this.client.get(`/api-definitions/${id}`);
    return response.data;
  }

  async createApi(data: {
    workspaceId: string;
    name: string;
    slug: string;
    version?: string;
    basePath?: string;
    description?: string;
  }) {
    const response = await this.client.post('/api-definitions', data);
    return response.data;
  }

  async deleteApi(id: string) {
    const response = await this.client.delete(`/api-definitions/${id}`);
    return response.data;
  }

  // Endpoints
  async listEndpoints(apiId: string) {
    const api = await this.getApi(apiId);
    return api.endpoints || [];
  }

  async createEndpoint(apiId: string, data: {
    method: string;
    path: string;
    summary?: string;
    responses: any[];
    delayMs?: number;
  }) {
    const response = await this.client.post(`/api-definitions/${apiId}/endpoints`, data);
    return response.data;
  }

  async deleteEndpoint(endpointId: string) {
    const response = await this.client.delete(`/api-definitions/endpoints/${endpointId}`);
    return response.data;
  }

  // Import
  async importOpenApi(file: string, workspaceId: string) {
    const fs = require('fs');
    const content = fs.readFileSync(file, 'utf-8');
    
    let spec;
    if (file.endsWith('.yaml') || file.endsWith('.yml')) {
      const YAML = require('yaml');
      spec = YAML.parse(content);
    } else {
      spec = JSON.parse(content);
    }

    const response = await this.client.post(
      '/api-definitions/import/openapi',
      spec,
      { params: { workspaceId } }
    );
    return response.data;
  }

  // Analytics
  async getAnalytics(params?: { apiSlug?: string; startDate?: string; endDate?: string }) {
    const response = await this.client.get('/admin/analytics/requests', { params });
    return response.data;
  }
}

export const apiClient = new ApiClient();

