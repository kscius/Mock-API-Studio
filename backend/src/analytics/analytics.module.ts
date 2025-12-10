// backend/src/analytics/analytics.module.ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsCleanupService } from './analytics-cleanup.service';
import { TrackingInterceptor } from './interceptors/tracking.interceptor';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule, ScheduleModule.forRoot()],
  providers: [
    AnalyticsService,
    AnalyticsCleanupService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TrackingInterceptor,
    },
  ],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

