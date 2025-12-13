// backend/src/api-definitions/api-definitions.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { CreateApiDefinitionDto } from './dto/create-api-definition.dto';
import { UpdateApiDefinitionDto } from './dto/update-api-definition.dto';
import { CreateEndpointDto } from './dto/create-endpoint.dto';
import { UpdateEndpointDto } from './dto/update-endpoint.dto';
import { DuplicateEndpointDto } from './dto/duplicate-endpoint.dto';

@Injectable()
export class ApiDefinitionsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // ========== API DEFINITIONS ==========

  findAll(workspaceId?: string) {
    return this.prisma.apiDefinition.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      include: { endpoints: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOneById(id: string) {
    return this.prisma.apiDefinition.findUnique({
      where: { id },
      include: { endpoints: true },
    });
  }

  findOneBySlug(workspaceId: string, slug: string) {
    return this.prisma.apiDefinition.findUnique({
      where: { workspaceId_slug: { workspaceId, slug } },
      include: { endpoints: true },
    });
  }

  async create(dto: CreateApiDefinitionDto) {
    const api = await this.prisma.apiDefinition.create({
      data: {
        workspaceId: dto.workspaceId,
        name: dto.name,
        slug: dto.slug,
        version: dto.version ?? '1.0.0',
        basePath: dto.basePath ?? '/',
        description: dto.description,
        isActive: dto.isActive ?? true,
        tags: dto.tags ?? [],
      },
    });

    // Invalidate cache
    await this.invalidateApiCache(dto.workspaceId, api.slug);

    return api;
  }

  async update(id: string, dto: UpdateApiDefinitionDto) {
    const api = await this.prisma.apiDefinition.update({
      where: { id },
      data: dto,
      include: { endpoints: true },
    });

    // Invalidate cache
    await this.invalidateApiCache(api.workspaceId, api.slug);

    return api;
  }

  async remove(id: string) {
    const api = await this.prisma.apiDefinition.findUnique({ where: { id } });
    if (api) {
      await this.invalidateApiCache(api.workspaceId, api.slug);
    }

    return this.prisma.apiDefinition.delete({ where: { id } });
  }

  // ========== ENDPOINTS ==========

  async createEndpoint(apiId: string, dto: CreateEndpointDto) {
    const endpoint = await this.prisma.apiEndpoint.create({
      data: {
        apiId,
        method: dto.method.toUpperCase(),
        path: dto.path,
        summary: dto.summary,
        requestSchema: dto.requestSchema ?? null,
        responses: dto.responses as any,
        delayMs: dto.delayMs ?? 0,
        enabled: dto.enabled ?? true,
        type: dto.type ?? 'REST',
        operationName: dto.operationName,
        operationType: dto.operationType,
      },
    });

    // Invalidate cache
    const api = await this.prisma.apiDefinition.findUnique({ where: { id: apiId } });
    if (api) {
      await this.invalidateApiCache(api.workspaceId, api.slug);
    }

    return endpoint;
  }

  async updateEndpoint(endpointId: string, dto: UpdateEndpointDto) {
    const endpoint = await this.prisma.apiEndpoint.update({
      where: { id: endpointId },
      data: {
        ...dto,
        method: dto.method ? dto.method.toUpperCase() : undefined,
      },
      include: { api: true },
    });

    // Invalidate cache
    await this.invalidateApiCache(endpoint.api.workspaceId, endpoint.api.slug);

    return endpoint;
  }

  async removeEndpoint(endpointId: string) {
    const endpoint = await this.prisma.apiEndpoint.findUnique({
      where: { id: endpointId },
      include: { api: true },
    });

    if (endpoint) {
      await this.invalidateApiCache(endpoint.api.workspaceId, endpoint.api.slug);
    }

    return this.prisma.apiEndpoint.delete({ where: { id: endpointId } });
  }

  async duplicateEndpoint(endpointId: string, dto?: DuplicateEndpointDto) {
    // Find the original endpoint
    const original = await this.prisma.apiEndpoint.findUnique({
      where: { id: endpointId },
      include: { api: true },
    });

    if (!original) {
      throw new Error('Endpoint not found');
    }

    // Generate new path if not provided
    let newPath = dto?.path;
    if (!newPath) {
      // Auto-generate path with suffix
      const pathWithoutSlash = original.path.replace(/\/$/, '');
      let suffix = 1;
      let candidatePath = `${pathWithoutSlash}-copy`;

      // Check if path already exists, increment suffix if needed
      while (true) {
        const existing = await this.prisma.apiEndpoint.findFirst({
          where: {
            apiId: original.apiId,
            method: dto?.method ?? original.method,
            path: candidatePath,
          },
        });

        if (!existing) {
          newPath = candidatePath;
          break;
        }

        suffix++;
        candidatePath = `${pathWithoutSlash}-copy-${suffix}`;
      }
    }

    // Create duplicated endpoint
    const duplicated = await this.prisma.apiEndpoint.create({
      data: {
        apiId: original.apiId,
        method: dto?.method ?? original.method,
        path: newPath,
        summary: dto?.summary ?? (original.summary ? `${original.summary} (Copy)` : null),
        requestSchema: original.requestSchema as any,
        responses: original.responses as any,
        delayMs: original.delayMs,
        enabled: original.enabled,
        type: original.type,
        operationName: original.operationName,
        operationType: original.operationType,
      },
    });

    // Invalidate cache
    await this.invalidateApiCache(original.api.workspaceId, original.api.slug);

    return duplicated;
  }

  // ========== IMPORT / EXPORT ==========

  async exportApi(apiId: string) {
    const api = await this.prisma.apiDefinition.findUnique({
      where: { id: apiId },
      include: { endpoints: true },
    });

    if (!api) {
      throw new Error('API not found');
    }

    return {
      type: 'mock-api-definition',
      schemaVersion: '1.0.0',
      api: {
        name: api.name,
        slug: api.slug,
        version: api.version,
        basePath: api.basePath,
        description: api.description,
        isActive: api.isActive,
        tags: api.tags,
      },
      endpoints: api.endpoints.map((ep) => ({
        method: ep.method,
        path: ep.path,
        summary: ep.summary,
        requestSchema: ep.requestSchema,
        responses: ep.responses,
        delayMs: ep.delayMs,
        enabled: ep.enabled,
      })),
    };
  }

  async importApi(data: any, workspaceId: string, overwrite = false) {
    const { api, endpoints } = data;

    // Check if API exists in this workspace
    const existing = await this.prisma.apiDefinition.findUnique({
      where: { workspaceId_slug: { workspaceId, slug: api.slug } },
    });

    let apiRecord;

    if (existing && !overwrite) {
      throw new Error('API with this slug already exists in this workspace. Set overwrite=true to replace.');
    }

    if (existing && overwrite) {
      // Delete existing API (cascade will delete endpoints)
      await this.prisma.apiDefinition.delete({ where: { id: existing.id } });
    }

    // Create API
    apiRecord = await this.prisma.apiDefinition.create({
      data: {
        workspaceId,
        name: api.name,
        slug: api.slug,
        version: api.version ?? '1.0.0',
        basePath: api.basePath ?? '/',
        description: api.description,
        isActive: api.isActive ?? true,
        tags: api.tags ?? [],
      },
    });

    // Create endpoints
    if (endpoints && endpoints.length > 0) {
      await this.prisma.apiEndpoint.createMany({
        data: endpoints.map((ep: any) => ({
          apiId: apiRecord.id,
          method: ep.method.toUpperCase(),
          path: ep.path,
          summary: ep.summary,
          requestSchema: ep.requestSchema ?? null,
          responses: ep.responses,
          delayMs: ep.delayMs ?? 0,
          enabled: ep.enabled ?? true,
          type: ep.type ?? 'REST',
          operationName: ep.operationName,
          operationType: ep.operationType,
        })),
      });
    }

    // Invalidate cache
    await this.invalidateApiCache(workspaceId, apiRecord.slug);

    return this.findOneById(apiRecord.id);
  }

  // ========== API VERSIONING ==========

  async createVersion(apiId: string, newVersion: string) {
    const originalApi = await this.prisma.apiDefinition.findUnique({
      where: { id: apiId },
      include: { endpoints: true },
    });

    if (!originalApi) {
      throw new Error(`API with ID ${apiId} not found`);
    }

    // Mark the original API as not latest
    await this.prisma.apiDefinition.update({
      where: { id: apiId },
      data: { isLatest: false },
    });

    // Create new version
    const newApi = await this.prisma.apiDefinition.create({
      data: {
        workspaceId: originalApi.workspaceId,
        name: originalApi.name,
        slug: originalApi.slug,
        version: newVersion,
        basePath: originalApi.basePath,
        description: originalApi.description,
        isActive: originalApi.isActive,
        isLatest: true,
        tags: originalApi.tags,
        parentId: originalApi.id,
        endpoints: {
          create: originalApi.endpoints.map((ep) => ({
            method: ep.method,
            path: ep.path,
            summary: ep.summary,
            requestSchema: ep.requestSchema as any,
            responses: ep.responses as any,
            delayMs: ep.delayMs,
            enabled: ep.enabled,
            type: ep.type,
            operationName: ep.operationName,
            operationType: ep.operationType,
          })),
        },
      },
      include: { endpoints: true },
    });

    // Invalidate cache
    await this.invalidateApiCache(originalApi.workspaceId, originalApi.slug);

    return newApi;
  }

  async getVersions(apiId: string) {
    const api = await this.prisma.apiDefinition.findUnique({
      where: { id: apiId },
      select: { slug: true, workspaceId: true },
    });

    if (!api) {
      throw new Error(`API with ID ${apiId} not found`);
    }

    // Get all versions of this API (same slug and workspace)
    return this.prisma.apiDefinition.findMany({
      where: {
        slug: api.slug,
        workspaceId: api.workspaceId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { endpoints: true },
        },
      },
    });
  }

  // ========== CACHE HELPERS ==========

  private async invalidateApiCache(workspaceId: string, slug: string) {
    const cacheKey = `mock:api:${workspaceId}:${slug}`;
    await this.redis.del(cacheKey);
  }
}

