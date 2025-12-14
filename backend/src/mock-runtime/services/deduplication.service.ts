import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service';
import { createHash } from 'crypto';

interface CachedResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
}

@Injectable()
export class DeduplicationService {
  private readonly logger = new Logger(DeduplicationService.name);
  private readonly TTL = 60; // 60 seconds

  constructor(private redis: RedisService) {}

  async checkDuplicate(
    endpointId: string,
    requestData: {
      method: string;
      path: string;
      body?: any;
      query?: Record<string, string>;
    },
  ): Promise<CachedResponse | null> {
    try {
      // Generate request hash
      const hash = this.generateHash(requestData);
      const key = `dedup:${endpointId}:${hash}`;

      // Check if exists in Redis
      const cached = await this.redis.get(key);

      if (cached) {
        this.logger.debug(`Duplicate request detected: ${key}`);
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      this.logger.error('Error checking duplicate:', error);
      return null;
    }
  }

  async cacheResponse(
    endpointId: string,
    requestData: {
      method: string;
      path: string;
      body?: any;
      query?: Record<string, string>;
    },
    response: {
      status: number;
      headers: Record<string, string>;
      body: any;
    },
  ): Promise<void> {
    try {
      const hash = this.generateHash(requestData);
      const key = `dedup:${endpointId}:${hash}`;

      await this.redis.setex(
        key,
        this.TTL,
        JSON.stringify(response),
      );

      this.logger.debug(`Cached response for deduplication: ${key}`);
    } catch (error) {
      this.logger.error('Error caching response:', error);
    }
  }

  private generateHash(requestData: {
    method: string;
    path: string;
    body?: any;
    query?: Record<string, string>;
  }): string {
    // Create a canonical representation of the request
    const canonical = {
      method: requestData.method,
      path: requestData.path,
      query: requestData.query ? this.sortObject(requestData.query) : undefined,
      body: requestData.body ? this.sortObject(requestData.body) : undefined,
    };

    const str = JSON.stringify(canonical);
    return createHash('sha256').update(str).digest('hex');
  }

  private sortObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObject(item));
    }

    const sorted: any = {};
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = this.sortObject(obj[key]);
    });

    return sorted;
  }
}

