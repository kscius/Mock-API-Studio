// backend/src/analytics/analytics.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('stats')
  async getStats(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('apiSlug') apiSlug?: string,
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    return this.service.getStats(fromDate, toDate, apiSlug);
  }

  @Get('clean')
  async cleanOldLogs(@Query('days') days?: string) {
    const daysToKeep = days ? parseInt(days, 10) : 30;
    return this.service.cleanOldLogs(daysToKeep);
  }
}

