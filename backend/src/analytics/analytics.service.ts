// backend/src/analytics/analytics.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface MockRequestLog {
  apiSlug: string;
  endpointId?: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userAgent?: string;
  ip?: string;
  error?: string;
}

export interface AnalyticsStats {
  totalRequests: number;
  avgDurationMs: number;
  successRate: number;
  topApis: Array<{ apiSlug: string; count: number }>;
  topEndpoints: Array<{ path: string; method: string; count: number }>;
  requestsByDay: Array<{ date: string; count: number }>;
  errorRate: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async logRequest(log: MockRequestLog) {
    await this.prisma.mockRequest.create({
      data: {
        apiSlug: log.apiSlug,
        endpointId: log.endpointId,
        method: log.method,
        path: log.path,
        statusCode: log.statusCode,
        durationMs: log.durationMs,
        userAgent: log.userAgent,
        ip: log.ip,
        error: log.error,
      },
    });
  }

  async getStats(
    from?: Date,
    to?: Date,
    apiSlug?: string,
  ): Promise<AnalyticsStats> {
    const where: any = {};

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    if (apiSlug) {
      where.apiSlug = apiSlug;
    }

    const requests = await this.prisma.mockRequest.findMany({
      where,
      select: {
        apiSlug: true,
        method: true,
        path: true,
        statusCode: true,
        durationMs: true,
        error: true,
        createdAt: true,
      },
    });

    const totalRequests = requests.length;

    if (totalRequests === 0) {
      return {
        totalRequests: 0,
        avgDurationMs: 0,
        successRate: 0,
        topApis: [],
        topEndpoints: [],
        requestsByDay: [],
        errorRate: 0,
      };
    }

    const totalDuration = requests.reduce((sum, r) => sum + r.durationMs, 0);
    const avgDurationMs = Math.round(totalDuration / totalRequests);

    const successCount = requests.filter((r) => r.statusCode >= 200 && r.statusCode < 400).length;
    const successRate = Math.round((successCount / totalRequests) * 100);

    const errorCount = requests.filter((r) => r.error || r.statusCode >= 500).length;
    const errorRate = Math.round((errorCount / totalRequests) * 100);

    // Top APIs
    const apiCounts: Record<string, number> = {};
    requests.forEach((r) => {
      apiCounts[r.apiSlug] = (apiCounts[r.apiSlug] || 0) + 1;
    });
    const topApis = Object.entries(apiCounts)
      .map(([apiSlug, count]) => ({ apiSlug, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top Endpoints
    const endpointCounts: Record<string, { method: string; path: string; count: number }> = {};
    requests.forEach((r) => {
      const key = `${r.method}:${r.path}`;
      if (!endpointCounts[key]) {
        endpointCounts[key] = { method: r.method, path: r.path, count: 0 };
      }
      endpointCounts[key].count++;
    });
    const topEndpoints = Object.values(endpointCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Requests by day
    const dayCounts: Record<string, number> = {};
    requests.forEach((r) => {
      const date = r.createdAt.toISOString().split('T')[0];
      dayCounts[date] = (dayCounts[date] || 0) + 1;
    });
    const requestsByDay = Object.entries(dayCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRequests,
      avgDurationMs,
      successRate,
      topApis,
      topEndpoints,
      requestsByDay,
      errorRate,
    };
  }

  async cleanOldLogs(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.mockRequest.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return { deleted: result.count };
  }
}

