// frontend/src/api/api-definitions.ts
import { apiClient } from './client';
import {
  ApiDefinition,
  CreateApiDefinitionDto,
  UpdateApiDefinitionDto,
  CreateEndpointDto,
  UpdateEndpointDto,
} from './types';

export const apiDefinitionsApi = {
  // API Definitions
  getAll: (workspaceId?: string) => 
    apiClient.get<ApiDefinition[]>('/api-definitions', {
      params: workspaceId ? { workspaceId } : undefined,
    }),
  
  getById: (id: string) => apiClient.get<ApiDefinition>(`/api-definitions/${id}`),
  
  create: (data: CreateApiDefinitionDto) =>
    apiClient.post<ApiDefinition>('/api-definitions', data),
  
  update: (id: string, data: UpdateApiDefinitionDto) =>
    apiClient.patch<ApiDefinition>(`/api-definitions/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/api-definitions/${id}`),

  // Endpoints
  createEndpoint: (apiId: string, data: CreateEndpointDto) =>
    apiClient.post(`/api-definitions/${apiId}/endpoints`, data),
  
  updateEndpoint: (endpointId: string, data: UpdateEndpointDto) =>
    apiClient.patch(`/api-definitions/endpoints/${endpointId}`, data),
  
  deleteEndpoint: (endpointId: string) =>
    apiClient.delete(`/api-definitions/endpoints/${endpointId}`),

  duplicateEndpoint: (endpointId: string, data?: { path?: string; method?: string; summary?: string }) =>
    apiClient.post(`/api-definitions/endpoints/${endpointId}/duplicate`, data || {}),

  // Import/Export
  exportApi: (apiId: string) =>
    apiClient.get(`/api-definitions/${apiId}/export`),
  
  exportPostman: (apiId: string) =>
    apiClient.get(`/api-definitions/${apiId}/export/postman`),

  exportInsomnia: (apiId: string) =>
    apiClient.get(`/api-definitions/${apiId}/export/insomnia`),

  importApi: (data: any, workspaceId: string, overwrite = false) =>
    apiClient.post(`/api-definitions/import?workspaceId=${workspaceId}&overwrite=${overwrite}`, data),

  importOpenApi: (data: any, workspaceId: string) =>
    apiClient.post(`/api-definitions/import/openapi?workspaceId=${workspaceId}`, data),
};

