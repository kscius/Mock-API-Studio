import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

export interface GrpcInvokeRequest {
  workspaceId?: string;
  apiSlug: string;
  service: string;
  method: string;
  input?: Record<string, unknown>;
}

export interface GrpcInvokeResponse {
  service: string;
  method: string;
  message: unknown;
  metadata?: Record<string, string>;
}

@Injectable()
export class GrpcRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async invoke(req: GrpcInvokeRequest): Promise<GrpcInvokeResponse> {
    const api = await this.getApiFromCacheOrDb(req.workspaceId, req.apiSlug);
    const normalizedService = this.normalizeService(req.service);
    const normalizedMethod = req.method.trim();

    const grpcEndpoints = api.endpoints.filter(
      (endpoint) =>
        endpoint.enabled &&
        endpoint.type === 'GRPC' &&
        this.normalizeService(endpoint.path) === normalizedService &&
        endpoint.method === normalizedMethod,
    );

    if (grpcEndpoints.length === 0) {
      throw new NotFoundException(
        `No gRPC mock for ${normalizedService}/${normalizedMethod}`,
      );
    }

    const endpoint = grpcEndpoints[0];
    const responses = (endpoint.responses as Array<{
      isDefault?: boolean;
      body?: unknown;
      headers?: Record<string, string>;
    }>) ?? [];
    const response = responses.find((item) => item.isDefault) ?? responses[0];

    if (!response) {
      throw new NotFoundException(
        `No mock response defined for ${normalizedService}/${normalizedMethod}`,
      );
    }

    if (endpoint.delayMs && endpoint.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, endpoint.delayMs));
    }

    if (endpoint.operationType === 'server_streaming') {
      const messages = Array.isArray(response.body)
        ? response.body
        : [response.body];
      return {
        service: normalizedService,
        method: normalizedMethod,
        message: messages,
        metadata: response.headers,
      };
    }

    return {
      service: normalizedService,
      method: normalizedMethod,
      message: response.body,
      metadata: response.headers,
    };
  }

  async listMethods(apiId: string) {
    const api = await this.prisma.apiDefinition.findUnique({
      where: { id: apiId },
      include: {
        endpoints: {
          where: { type: 'GRPC', enabled: true },
          orderBy: { path: 'asc' },
        },
      },
    });

    if (!api) {
      throw new NotFoundException(`API with ID ${apiId} not found`);
    }

    return api.endpoints.map((endpoint) => ({
      id: endpoint.id,
      service: endpoint.path,
      method: endpoint.method,
      summary: endpoint.summary,
      streaming: endpoint.operationType ?? 'unary',
      delayMs: endpoint.delayMs,
    }));
  }

  async listMethodsBySlug(apiSlug: string, workspaceId?: string) {
    const api = await this.getApiFromCacheOrDb(workspaceId, apiSlug);
    return {
      apiSlug,
      methods: api.endpoints
        .filter((endpoint) => endpoint.enabled && endpoint.type === 'GRPC')
        .map((endpoint) => ({
          service: endpoint.path,
          method: endpoint.method,
          summary: endpoint.summary,
          streaming: endpoint.operationType ?? 'unary',
        })),
    };
  }

  private normalizeService(service: string): string {
    const trimmed = service.trim();
    if (!trimmed) {
      throw new BadRequestException('service is required');
    }
    return trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  }

  private async getApiFromCacheOrDb(workspaceId: string | undefined, apiSlug: string) {
    if (!workspaceId) {
      const apis = await this.prisma.apiDefinition.findMany({
        where: { slug: apiSlug, isActive: true },
        include: { endpoints: true },
      });

      if (apis.length === 0) {
        throw new NotFoundException('API not found or inactive');
      }

      if (apis.length > 1) {
        throw new BadRequestException(
          `Multiple APIs found with slug '${apiSlug}'. Please specify workspaceId.`,
        );
      }

      return apis[0];
    }

    const cacheKey = `mock:api:${workspaceId}:${apiSlug}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const api = await this.prisma.apiDefinition.findFirst({
      where: { workspaceId, slug: apiSlug, isLatest: true },
      include: { endpoints: true },
    });

    if (!api || !api.isActive) {
      throw new NotFoundException('API not found or inactive');
    }

    await this.redis.set(cacheKey, JSON.stringify(api), 60);
    return api;
  }
}
