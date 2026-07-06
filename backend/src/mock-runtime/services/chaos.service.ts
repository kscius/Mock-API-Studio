import { Injectable } from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service';

export interface ChaosConfig {
  errorRate?: number;
  timeoutRate?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
  errorStatus?: number;
}

@Injectable()
export class ChaosService {
  constructor(private readonly redis: RedisService) {}

  async getSequenceIndex(endpointId: string): Promise<number> {
    const key = `mock:seq:${endpointId}`;
    const current = await this.redis.get(key);
    const index = current ? parseInt(current, 10) : 0;
    await this.redis.set(key, String(index + 1), 86400);
    return index;
  }

  async resetSequence(endpointId: string): Promise<void> {
    await this.redis.del(`mock:seq:${endpointId}`);
  }

  applyChaos(config: ChaosConfig | null | undefined): {
    shouldFail: boolean;
    shouldTimeout: boolean;
    extraDelayMs: number;
    errorStatus: number;
  } {
    const errorRate = config?.errorRate ?? 0;
    const timeoutRate = config?.timeoutRate ?? 0;
    const minDelay = config?.minDelayMs ?? 0;
    const maxDelay = config?.maxDelayMs ?? 0;
    const roll = Math.random();

    const shouldFail = roll < errorRate;
    const shouldTimeout = !shouldFail && roll < errorRate + timeoutRate;
    const extraDelayMs =
      maxDelay > minDelay
        ? minDelay + Math.floor(Math.random() * (maxDelay - minDelay + 1))
        : minDelay;

    return {
      shouldFail,
      shouldTimeout,
      extraDelayMs,
      errorStatus: config?.errorStatus ?? 500,
    };
  }
}
