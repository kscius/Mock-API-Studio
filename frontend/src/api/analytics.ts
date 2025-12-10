// frontend/src/api/analytics.ts
import { apiClient } from './client';

export interface AnalyticsStats {
  totalRequests: number;
  avgDurationMs: number;
  successRate: number;
  errorRate: number;
  topApis: Array<{ apiSlug: string; count: number }>;
  topEndpoints: Array<{ method: string; path: string; count: number }>;
  requestsByDay: Array<{ date: string; count: number }>;
}

export interface AnalyticsFilters {
  from?: string; // ISO date
  to?: string; // ISO date
  apiSlug?: string;
}

export const AnalyticsApi = {
  getStats: async (filters?: AnalyticsFilters): Promise<AnalyticsStats> => {
    const params: Record<string, string> = {};
    if (filters?.from) params.from = filters.from;
    if (filters?.to) params.to = filters.to;
    if (filters?.apiSlug) params.apiSlug = filters.apiSlug;

    const response = await apiClient.get('/analytics/stats', { params });
    return response.data;
  },

  cleanOldLogs: async (days: number = 30): Promise<{ deleted: number }> => {
    const response = await apiClient.get('/analytics/clean', {
      params: { days: days.toString() },
    });
    return response.data;
  },
};

