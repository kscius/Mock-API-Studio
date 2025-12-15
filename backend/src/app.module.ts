// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { SharedModule } from './shared/shared.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ApiDefinitionsModule } from './api-definitions/api-definitions.module';
import { MockRuntimeModule } from './mock-runtime/mock-runtime.module';
import { AuthModule } from './auth/auth.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { GraphQLRuntimeModule } from './graphql-runtime/graphql-runtime.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { WebSocketMocksModule } from './websocket-mocks/websocket-mocks.module';
import { UsersModule } from './users/users.module';
import { MockRecordingModule } from './mock-recording/mock-recording.module';
import { AuditLogInterceptor } from './audit-logs/interceptors/audit-log.interceptor';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    ConfigModule,
    PrismaModule,
    RedisModule,
    MetricsModule,
    SharedModule,
    AuthModule,
    WorkspacesModule,
    ApiDefinitionsModule,
    WebhooksModule,
    MockRuntimeModule,
    GraphQLRuntimeModule,
    AnalyticsModule,
    AuditLogsModule,
    IntegrationsModule,
    WebSocketMocksModule,
    UsersModule,
    MockRecordingModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}

