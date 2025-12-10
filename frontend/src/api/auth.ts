// frontend/src/api/auth.ts
import { apiClient } from './client';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiKey {
  id: string;
  name: string;
  scope: string[];
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface CreateApiKeyRequest {
  name: string;
  scope?: string[];
  expiresAt?: string;
}

export interface CreateApiKeyResponse {
  apiKey: ApiKey;
  rawKey: string; // Solo se muestra una vez
}

export const AuthApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  createApiKey: async (data: CreateApiKeyRequest): Promise<CreateApiKeyResponse> => {
    const response = await apiClient.post('/auth/api-keys', data);
    return response.data;
  },

  listApiKeys: async (): Promise<ApiKey[]> => {
    const response = await apiClient.get('/auth/api-keys');
    return response.data;
  },

  revokeApiKey: async (id: string): Promise<void> => {
    await apiClient.delete(`/auth/api-keys/${id}`);
  },
};

