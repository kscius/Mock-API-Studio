import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ProviderFactory } from './providers/provider.factory';

@Injectable()
export class AutoDocumentationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: ProviderFactory,
  ) {}

  async generateMarkdown(apiId: string): Promise<{ markdown: string; endpointCount: number }> {
    const api = await this.prisma.apiDefinition.findUnique({
      where: { id: apiId },
      include: { endpoints: true },
    });

    if (!api) {
      throw new NotFoundException(`API with ID ${apiId} not found`);
    }

    const endpointSummary = api.endpoints
      .filter((ep) => ep.enabled)
      .map((ep) => {
        const responses = ep.responses as Array<{ status: number; isDefault?: boolean }>;
        const defaultStatus =
          responses.find((r) => r.isDefault)?.status ?? responses[0]?.status ?? 200;
        return `- ${ep.method} ${ep.path} (${defaultStatus}) — ${ep.summary ?? 'No summary'}`;
      })
      .join('\n');

    const provider = this.providerFactory.getProvider();
    const markdown = await provider.generateText(
      `Write clear API documentation in Markdown for a mock REST API.

API name: ${api.name}
Slug: ${api.slug}
Version: ${api.version}
Base path: ${api.basePath}
Description: ${api.description ?? 'N/A'}

Endpoints:
${endpointSummary || 'No endpoints yet'}

Include: overview, authentication note (Bearer JWT or API key), endpoint sections with method/path, example request/response JSON, and error codes. Keep it practical for developers.`,
    );

    return { markdown, endpointCount: api.endpoints.length };
  }
}
