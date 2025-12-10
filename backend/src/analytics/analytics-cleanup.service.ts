import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '../config/config.service';

@Injectable()
export class AnalyticsCleanupService {
  private readonly logger = new Logger(AnalyticsCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Scheduled cleanup job - runs daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldAnalytics() {
    const retentionDays = this.config.analyticsRetentionDays;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    this.logger.log(
      `Starting analytics cleanup for records older than ${retentionDays} days (before ${cutoffDate.toISOString()})`,
    );

    try {
      const result = await this.prisma.mockRequest.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(
        `Analytics cleanup completed. Deleted ${result.count} records.`,
      );
    } catch (error: any) {
      this.logger.error(
        `Analytics cleanup failed: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Manual cleanup (can be triggered via admin endpoint if needed)
   */
  async cleanupManual(daysToKeep: number = this.config.analyticsRetentionDays) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    this.logger.log(
      `Manual analytics cleanup triggered for records older than ${daysToKeep} days`,
    );

    const result = await this.prisma.mockRequest.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return {
      deletedCount: result.count,
      cutoffDate: cutoffDate.toISOString(),
      retentionDays: daysToKeep,
    };
  }
}

