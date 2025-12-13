export enum ApiScope {
  // API Definitions
  READ_APIS = 'read:apis',
  WRITE_APIS = 'write:apis',
  DELETE_APIS = 'delete:apis',

  // Endpoints
  READ_ENDPOINTS = 'read:endpoints',
  WRITE_ENDPOINTS = 'write:endpoints',
  DELETE_ENDPOINTS = 'delete:endpoints',

  // Workspaces
  READ_WORKSPACES = 'read:workspaces',
  WRITE_WORKSPACES = 'write:workspaces',
  DELETE_WORKSPACES = 'delete:workspaces',
  ADMIN_WORKSPACE = 'admin:workspace',

  // Analytics
  READ_ANALYTICS = 'read:analytics',

  // Webhooks
  READ_WEBHOOKS = 'read:webhooks',
  WRITE_WEBHOOKS = 'write:webhooks',
  DELETE_WEBHOOKS = 'delete:webhooks',

  // Audit Logs
  READ_AUDIT_LOGS = 'read:audit_logs',

  // All permissions
  ALL = '*',
}

export const SCOPE_DESCRIPTIONS: Record<ApiScope, string> = {
  [ApiScope.READ_APIS]: 'Read API definitions',
  [ApiScope.WRITE_APIS]: 'Create and update API definitions',
  [ApiScope.DELETE_APIS]: 'Delete API definitions',
  [ApiScope.READ_ENDPOINTS]: 'Read endpoints',
  [ApiScope.WRITE_ENDPOINTS]: 'Create and update endpoints',
  [ApiScope.DELETE_ENDPOINTS]: 'Delete endpoints',
  [ApiScope.READ_WORKSPACES]: 'Read workspaces',
  [ApiScope.WRITE_WORKSPACES]: 'Create and update workspaces',
  [ApiScope.DELETE_WORKSPACES]: 'Delete workspaces',
  [ApiScope.ADMIN_WORKSPACE]: 'Full workspace administration',
  [ApiScope.READ_ANALYTICS]: 'Read analytics data',
  [ApiScope.READ_WEBHOOKS]: 'Read webhooks',
  [ApiScope.WRITE_WEBHOOKS]: 'Create and update webhooks',
  [ApiScope.DELETE_WEBHOOKS]: 'Delete webhooks',
  [ApiScope.READ_AUDIT_LOGS]: 'Read audit logs',
  [ApiScope.ALL]: 'All permissions',
};

