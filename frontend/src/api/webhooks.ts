import apiClient from './client';

export interface Webhook {
  id: string;
  workspaceId?: string;
  apiId?: string;
  targetUrl: string;
  eventType: string;
  isActive: boolean;
  secret?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookDto {
  workspaceId?: string;
  apiId?: string;
  targetUrl: string;
  eventType: string;
  isActive?: boolean;
  secret?: string;
}

export interface UpdateWebhookDto {
  targetUrl?: string;
  eventType?: string;
  isActive?: boolean;
  secret?: string;
}

export const webhooksApi = {
  getAll: async (workspaceId?: string): Promise<Webhook[]> => {
    const params = workspaceId ? { workspaceId } : undefined;
    const { data } = await apiClient.get<Webhook[]>('/admin/webhooks', { params });
    return data;
  },

  getOne: async (id: string): Promise<Webhook> => {
    const { data } = await apiClient.get<Webhook>(`/admin/webhooks/${id}`);
    return data;
  },

  create: async (dto: CreateWebhookDto): Promise<Webhook> => {
    const { data } = await apiClient.post<Webhook>('/admin/webhooks', dto);
    return data;
  },

  update: async (id: string, dto: UpdateWebhookDto): Promise<Webhook> => {
    const { data } = await apiClient.put<Webhook>(`/admin/webhooks/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/webhooks/${id}`);
  },
};

