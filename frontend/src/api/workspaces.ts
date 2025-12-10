import apiClient from './client';
import { Workspace, CreateWorkspaceDto, UpdateWorkspaceDto } from './types';

export const workspacesApi = {
  getAll: async (): Promise<Workspace[]> => {
    const { data } = await apiClient.get<Workspace[]>('/admin/workspaces');
    return data;
  },

  getOne: async (id: string): Promise<Workspace> => {
    const { data } = await apiClient.get<Workspace>(`/admin/workspaces/${id}`);
    return data;
  },

  create: async (dto: CreateWorkspaceDto): Promise<Workspace> => {
    const { data } = await apiClient.post<Workspace>('/admin/workspaces', dto);
    return data;
  },

  update: async (id: string, dto: UpdateWorkspaceDto): Promise<Workspace> => {
    const { data } = await apiClient.put<Workspace>(`/admin/workspaces/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/workspaces/${id}`);
  },
};

