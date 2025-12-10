import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

interface GraphQLRequest {
  query: string;
  operationName?: string;
  variables?: Record<string, any>;
}

interface GraphQLRuntimeRequest {
  workspaceId?: string;
  apiSlug: string;
  graphqlRequest: GraphQLRequest;
}

@Injectable()
export class GraphQLRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async handleGraphQLRequest(req: GraphQLRuntimeRequest) {
    // Get API definition
    const api = await this.getApiFromCacheOrDb(req.workspaceId, req.apiSlug);

    if (!api) {
      throw new NotFoundException('API not found or inactive');
    }

    // Find GraphQL endpoints
    const graphqlEndpoints = api.endpoints.filter(
      (e: any) => e.enabled && e.type === 'GRAPHQL',
    );

    if (graphqlEndpoints.length === 0) {
      throw new NotFoundException('No GraphQL endpoints configured for this API');
    }

    // Match by operationName
    let matchedEndpoint: any = null;

    if (req.graphqlRequest.operationName) {
      matchedEndpoint = graphqlEndpoints.find(
        (e: any) => e.operationName === req.graphqlRequest.operationName,
      );
    }

    // If no match by operationName, try to extract from query
    if (!matchedEndpoint) {
      const extractedOperationName = this.extractOperationName(req.graphqlRequest.query);
      if (extractedOperationName) {
        matchedEndpoint = graphqlEndpoints.find(
          (e: any) => e.operationName === extractedOperationName,
        );
      }
    }

    // If still no match, use first GraphQL endpoint
    if (!matchedEndpoint) {
      matchedEndpoint = graphqlEndpoints[0];
    }

    // Get response
    const responses = matchedEndpoint.responses ?? [];
    const response = responses.find((r: any) => r.isDefault) ?? responses[0];

    if (!response) {
      throw new NotFoundException('No mock response defined for this GraphQL operation');
    }

    // Apply delay if configured
    if (matchedEndpoint.delayMs && matchedEndpoint.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, matchedEndpoint.delayMs));
    }

    // Return GraphQL response format
    return {
      data: response.body,
    };
  }

  /**
   * Simple extraction of operation name from GraphQL query
   */
  private extractOperationName(query: string): string | null {
    const match = query.match(/(?:query|mutation|subscription)\s+(\w+)/);
    return match ? match[1] : null;
  }

  private async getApiFromCacheOrDb(workspaceId: string | undefined, apiSlug: string) {
    // If no workspaceId provided, try to find a unique API
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

    await this.redis.set(cacheKey, JSON.stringify(api), 60);
    return api;
  }
}

