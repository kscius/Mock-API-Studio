import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { ConfigService } from '../../config/config.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class WorkspaceThrottleGuard extends ThrottlerGuard {
  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extract workspace ID from headers or query
    const workspaceId = 
      request.headers['x-workspace-id'] || 
      request.query?.workspaceId ||
      'global';

    const key = `rate-limit:workspace:${workspaceId}:${Date.now().toString().slice(0, -3)}`; // 1-second window
    const limit = this.config.workspaceRateLimitRpm / 60; // Convert RPM to per-second

    const current = await this.redis.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= limit) {
      throw new ThrottlerException('Rate limit exceeded for this workspace');
    }

    await this.redis.set(key, (count + 1).toString(), 60);
    
    return true;
  }
}

