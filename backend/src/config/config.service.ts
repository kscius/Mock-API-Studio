// backend/src/config/config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL', '');
  }

  get redisHost(): string {
    return this.configService.get<string>('REDIS_HOST', 'localhost');
  }

  get redisPort(): number {
    return this.configService.get<number>('REDIS_PORT', 6379);
  }

  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get jwtSecret(): string {
    return this.configService.get<string>(
      'JWT_SECRET',
      'mock-api-studio-secret-change-in-production',
    );
  }

  get analyticsEnabled(): boolean {
    return this.configService.get<string>('ANALYTICS_ENABLED', 'false') === 'true';
  }

  get cacheTtlSeconds(): number {
    return this.configService.get<number>('MOCK_API_CACHE_TTL_SECONDS', 60);
  }

  get analyticsRetentionDays(): number {
    return this.configService.get<number>('ANALYTICS_RETENTION_DAYS', 90);
  }

  get globalRateLimitRpm(): number {
    return this.configService.get<number>('GLOBAL_RATE_LIMIT_RPM', 100);
  }

  get workspaceRateLimitRpm(): number {
    return this.configService.get<number>('WORKSPACE_RATE_LIMIT_RPM', 500);
  }

  get webhookRetryAttempts(): number {
    return this.configService.get<number>('WEBHOOK_RETRY_ATTEMPTS', 3);
  }

  get webhookRetryDelayMs(): number {
    return this.configService.get<number>('WEBHOOK_RETRY_DELAY_MS', 1000);
  }
}

