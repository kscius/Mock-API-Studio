// frontend/src/api/types.ts

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    apiDefinitions: number;
  };
}

export interface CreateWorkspaceDto {
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateWorkspaceDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface ApiDefinition {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  version: string;
  basePath: string;
  description?: string;
  isActive: boolean;
  tags: string[];
  endpoints?: ApiEndpoint[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiEndpoint {
  id: string;
  apiId: string;
  method: string;
  path: string;
  summary?: string;
  requestSchema?: any;
  responses: MockResponse[];
  delayMs: number;
  enabled: boolean;
  type: string; // REST | GRAPHQL
  operationName?: string;
  operationType?: string; // query | mutation | subscription
  createdAt: string;
  updatedAt: string;
}

export interface MockResponse {
  status: number;
  headers?: Record<string, string>;
  body?: any;
  isDefault?: boolean;
}

export interface CreateApiDefinitionDto {
  workspaceId: string;
  name: string;
  slug: string;
  version?: string;
  basePath?: string;
  description?: string;
  isActive?: boolean;
  tags?: string[];
}

export interface UpdateApiDefinitionDto {
  name?: string;
  slug?: string;
  version?: string;
  basePath?: string;
  description?: string;
  isActive?: boolean;
  tags?: string[];
}

export interface CreateEndpointDto {
  method: string;
  path: string;
  summary?: string;
  requestSchema?: any;
  responses: MockResponse[];
  delayMs?: number;
  enabled?: boolean;
  type?: string;
  operationName?: string;
  operationType?: string;
}

export interface UpdateEndpointDto {
  method?: string;
  path?: string;
  summary?: string;
  requestSchema?: any;
  responses?: MockResponse[];
  delayMs?: number;
  enabled?: boolean;
  type?: string;
  operationName?: string;
  operationType?: string;
}

export interface DuplicateEndpointDto {
  path?: string;
  summary?: string;
}

export interface User {
  id: string;
  name?: string;
  email: string;
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  userId?: string;
  user?: User;
  action: string; // create, update, delete, duplicate
  entityType: string; // api, endpoint, workspace, webhook
  entityId: string;
  entityName?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

