// backend/src/audit-logs/audit-logs.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an audit log entry
   */
  async create(dto: CreateAuditLogDto) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          workspaceId: dto.workspaceId,
          userId: dto.userId,
          action: dto.action,
          entityType: dto.entityType,
          entityId: dto.entityId,
          entityName: dto.entityName,
          changes: dto.changes as any,
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
      // Don't throw - audit logging should not break the main flow
      return null;
    }
  }

  /**
   * Query audit logs with filters and pagination
   */
  async findAll(query: QueryAuditLogsDto) {
    const {
      workspaceId,
      userId,
      entityType,
      entityId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortOrder = 'desc',
    } = query;

    const where: any = {};

    if (workspaceId) where.workspaceId = workspaceId;
    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get audit logs for a specific entity
   */
  async findByEntity(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Last 100 changes
    });
  }

  /**
   * Cleanup old audit logs (runs daily at 2 AM)
   * Deletes logs older than 90 days by default
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldLogs() {
    const retentionDays = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90', 10);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const result = await this.prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(`Cleaned up ${result.count} audit logs older than ${retentionDays} days`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to cleanup audit logs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get audit log statistics
   */
  async getStats(workspaceId?: string) {
    const where = workspaceId ? { workspaceId } : {};

    const [
      totalLogs,
      actionCounts,
      entityTypeCounts,
      recentActivity,
    ] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),

      this.prisma.auditLog.groupBy({
        by: ['entityType'],
        where,
        _count: true,
      }),

      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      totalLogs,
      byAction: actionCounts.reduce((acc, item) => {
        acc[item.action] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byEntityType: entityTypeCounts.reduce((acc, item) => {
        acc[item.entityType] = item._count;
        return acc;
      }, {} as Record<string, number>),
      recentActivity,
    };
  }
}

