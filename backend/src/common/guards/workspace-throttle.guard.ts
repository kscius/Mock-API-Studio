import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class WorkspaceThrottleGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const workspaceId =
      request.headers['x-workspace-id'] ||
      request.query?.workspaceId ||
      'global';

    const key = `rate-limit:workspace:${workspaceId}:${Date.now().toString().slice(0, -3)}`;
    const limit = this.config.workspaceRateLimitRpm / 60;

    const current = await this.redis.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= limit) {
      throw new HttpException('Rate limit exceeded for this workspace', HttpStatus.TOO_MANY_REQUESTS);
    }

    await this.redis.set(key, (count + 1).toString(), 60);

    return true;
  }
}
