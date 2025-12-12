// backend/src/audit-logs/dto/create-audit-log.dto.ts
export interface CreateAuditLogDto {
  workspaceId: string;
  userId?: string;
  action: 'create' | 'update' | 'delete';
  entityType: 'api' | 'endpoint' | 'workspace' | 'webhook' | 'user';
  entityId: string;
  entityName?: string;
  changes?: {
    before?: any;
    after?: any;
  };
  ipAddress?: string;
  userAgent?: string;
}

