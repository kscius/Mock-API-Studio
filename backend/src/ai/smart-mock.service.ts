import { Injectable } from '@nestjs/common';
import { ApiEndpoint } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { ProviderFactory } from './providers/provider.factory';

@Injectable()
export class SmartMockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: ProviderFactory,
  ) {}

  async generateFromDescription(apiId: string, description: string) {
    const api = await this.prisma.apiDefinition.findUnique({
      where: { id: apiId },
      include: { endpoints: true },
    });
    if (!api) {
      throw new Error('API not found');
    }

    const provider = this.providerFactory.getProvider();
    const result = await provider.generateJSON<{
      endpoints: Array<{
        method: string;
        path: string;
        summary: string;
        responses: Array<{ status: number; body: unknown; isDefault?: boolean }>;
      }>;
    }>(
      `Generate REST mock API endpoints for "${api.name}" (${api.slug}).
Description: ${description}
Existing endpoints: ${api.endpoints.map((e) => `${e.method} ${e.path}`).join(', ') || 'none'}
Return JSON: { "endpoints": [{ "method", "path", "summary", "responses": [{ "status", "body", "isDefault" }] }] }`,
    );

    const created: ApiEndpoint[] = [];
    for (const ep of result.endpoints ?? []) {
      const endpoint = await this.prisma.apiEndpoint.create({
        data: {
          apiId,
          method: ep.method.toUpperCase(),
          path: ep.path,
          summary: ep.summary,
          responses: ep.responses as any,
          enabled: true,
        },
      });
      created.push(endpoint);
    }

    return { created: created.length, endpoints: created };
  }
}
