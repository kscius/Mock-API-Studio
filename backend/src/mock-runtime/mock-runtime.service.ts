// backend/src/mock-runtime/mock-runtime.service.ts
import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { ConfigService } from '../config/config.service';
import { PathMatcher } from '../shared/utils/path-matcher';
import { ValidationService } from '../shared/services/validation.service';
import { renderWithTemplate } from '../shared/utils/template-engine';
import { responseMatches } from '../shared/utils/response-matcher';
import { WebhooksService } from '../webhooks/webhooks.service';

interface ResponseMatchRule {
  query?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  bodyEquals?: any;
}

interface MockResponse {
  status: number;
  headers?: Record<string, string>;
  body?: any;
  isDefault?: boolean;
  match?: ResponseMatchRule;
}

interface RuntimeRequest {
  workspaceId?: string;
  apiSlug: string;
  method: string;
  path: string;
  body: any;
  query: any;
  headers: Record<string, string>;
}

@Injectable()
export class MockRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly validation: ValidationService,
    @Inject(forwardRef(() => WebhooksService))
    private readonly webhooks: WebhooksService,
  ) {}

  async handleRequest(req: RuntimeRequest) {
    const api = await this.getApiFromCacheOrDb(req.workspaceId, req.apiSlug);

    const candidates = api.endpoints.filter(
      (e: any) =>
        e.enabled && e.method.toUpperCase() === req.method.toUpperCase(),
    );

    let matchedEndpoint: any = null;
    let params: Record<string, string> = {};

    for (const endpoint of candidates) {
      const normalizedTemplatePath = PathMatcher.normalize(endpoint.path);
      const normalizedRequestPath = PathMatcher.normalize(req.path);
      const match = PathMatcher.match(normalizedTemplatePath, normalizedRequestPath);

      if (match) {
        matchedEndpoint = endpoint;
        params = match.params;
        break;
      }
    }

    if (!matchedEndpoint) {
      throw new NotFoundException('Endpoint not found');
    }

    // VALIDACIÓN con JSON Schema
    if (matchedEndpoint.requestSchema) {
      const validationResult = this.validation.validateFullRequest(
        matchedEndpoint.requestSchema,
        {
          query: req.query,
          body: req.body,
          headers: req.headers,
        },
      );

      if (!validationResult.valid) {
        throw new BadRequestException({
          message: 'Request validation failed',
          errors: validationResult.errors,
        });
      }
    }

    const responses: MockResponse[] = matchedEndpoint.responses ?? [];

    // 1) Intentar responses con rule.match
    const ctx = {
      query: req.query || {},
      headers: req.headers || {},
      body: req.body,
    };

    let response =
      responses.find((r) => responseMatches(r.match, ctx)) ??
      // 2) fallback a isDefault
      responses.find((r) => r.isDefault) ??
      // 3) fallback al primero
      responses[0];

    if (!response) {
      throw new NotFoundException('No mock response defined');
    }

    // delay simulado
    if (matchedEndpoint.delayMs && matchedEndpoint.delayMs > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, matchedEndpoint.delayMs),
      );
    }

    // TEMPLATING de body con Handlebars
    const renderedBody = renderWithTemplate(response.body, {
      params,
      query: req.query || {},
      body: req.body,
      headers: req.headers || {},
    });

    const result = {
      statusCode: response.status,
      headers: response.headers ?? { 'Content-Type': 'application/json' },
      body: renderedBody,
    };

    // Fire webhooks asynchronously (don't block response)
    setImmediate(() => {
      this.webhooks
        .fireWebhooks('mock.request.received', {
          event: 'mock.request.received',
          timestamp: new Date().toISOString(),
          workspaceId: req.workspaceId,
          apiSlug: req.apiSlug,
          endpoint: {
            id: matchedEndpoint.id,
            method: matchedEndpoint.method,
            path: matchedEndpoint.path,
          },
          request: {
            method: req.method,
            path: req.path,
            headers: req.headers,
            query: req.query,
            body: req.body,
          },
          response: {
            statusCode: result.statusCode,
            headers: result.headers,
            body: result.body,
          },
        })
        .catch((err) => {
          // Silently fail - already logged in WebhooksService
        });
    });

    return result;
  }

  private async getApiFromCacheOrDb(workspaceId: string | undefined, apiSlug: string) {
    // If no workspaceId provided, try to find a unique API with this slug across all workspaces
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

    // With workspaceId, use cache
    const cacheKey = `mock:api:${workspaceId}:${apiSlug}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const api = await this.prisma.apiDefinition.findUnique({
      where: { workspaceId_slug: { workspaceId, slug: apiSlug } },
      include: { endpoints: true },
    });

    if (!api || !api.isActive) {
      throw new NotFoundException('API not found or inactive');
    }

    await this.redis.set(cacheKey, JSON.stringify(api), this.config.cacheTtlSeconds);
    return api;
  }

}

