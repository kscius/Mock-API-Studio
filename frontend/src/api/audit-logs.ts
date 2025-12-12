import apiClient from './client';

export const auditLogsApi = {
  getAuditLogs: (params?: {
    workspaceId?: string;
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;
  }) => apiClient.get('/admin/audit-logs', { params }),
};

