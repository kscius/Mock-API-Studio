import { Injectable } from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service';

const STATE_TTL_SECONDS = 86400;

@Injectable()
export class MockStateService {
  constructor(private readonly redis: RedisService) {}

  private key(endpointId: string, stateKey: string): string {
    return `mock:state:${endpointId}:${stateKey}`;
  }

  async get(endpointId: string, stateKey: string): Promise<string | null> {
    return this.redis.get(this.key(endpointId, stateKey));
  }

  async set(endpointId: string, stateKey: string, value: string): Promise<void> {
    await this.redis.set(this.key(endpointId, stateKey), value, STATE_TTL_SECONDS);
  }

  async increment(endpointId: string, stateKey: string): Promise<number> {
    const current = await this.get(endpointId, stateKey);
    const next = (parseInt(current || '0', 10) + 1).toString();
    await this.set(endpointId, stateKey, next);
    return parseInt(next, 10);
  }

  async reset(endpointId: string): Promise<void> {
    await this.redis.delPattern(`mock:state:${endpointId}:*`);
  }

  async resetApi(apiId: string, endpointIds: string[]): Promise<void> {
    await Promise.all(endpointIds.map((id) => this.reset(id)));
  }
}
