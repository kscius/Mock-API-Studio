import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export enum ChangeType {
  ADDED = 'added',
  REMOVED = 'removed',
  MODIFIED = 'modified',
  UNCHANGED = 'unchanged',
}

export enum BreakingChangeType {
  ENDPOINT_REMOVED = 'endpoint_removed',
  METHOD_CHANGED = 'method_changed',
  PATH_CHANGED = 'path_changed',
  REQUIRED_PARAM_ADDED = 'required_param_added',
  RESPONSE_STATUS_CHANGED = 'response_status_changed',
  RESPONSE_SCHEMA_BREAKING = 'response_schema_breaking',
}

export interface EndpointDiff {
  changeType: ChangeType;
  method: string;
  path: string;
  summary?: string;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    changeType: ChangeType;
  }>;
  breakingChanges: Array<{
    type: BreakingChangeType;
    description: string;
    severity: 'critical' | 'major' | 'minor';
  }>;
}

export interface ApiDiffResult {
  fromVersion: string;
  toVersion: string;
  addedEndpoints: EndpointDiff[];
  removedEndpoints: EndpointDiff[];
  modifiedEndpoints: EndpointDiff[];
  unchangedCount: number;
  breakingChangesCount: number;
  summary: {
    totalChanges: number;
    additions: number;
    deletions: number;
    modifications: number;
    breakingChanges: number;
  };
}

@Injectable()
export class ApiDiffService {
  private readonly logger = new Logger(ApiDiffService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Compare two API versions and generate diff
   */
  async compareVersions(
    apiId: string,
    fromVersion: string,
    toVersion: string,
  ): Promise<ApiDiffResult> {
    // Load both API versions
    const fromApi = await this.loadApiVersion(apiId, fromVersion);
    const toApi = await this.loadApiVersion(apiId, toVersion);

    if (!fromApi || !toApi) {
      throw new NotFoundException('One or both API versions not found');
    }

    // Compare endpoints
    const result: ApiDiffResult = {
      fromVersion,
      toVersion,
      addedEndpoints: [],
      removedEndpoints: [],
      modifiedEndpoints: [],
      unchangedCount: 0,
      breakingChangesCount: 0,
      summary: {
        totalChanges: 0,
        additions: 0,
        deletions: 0,
        modifications: 0,
        breakingChanges: 0,
      },
    };

    const fromEndpoints = fromApi.endpoints;
    const toEndpoints = toApi.endpoints;

    // Create endpoint maps for comparison
    const fromMap = new Map(
      fromEndpoints.map((ep) => [this.getEndpointKey(ep), ep]),
    );
    const toMap = new Map(
      toEndpoints.map((ep) => [this.getEndpointKey(ep), ep]),
    );

    // Find added endpoints
    for (const [key, endpoint] of toMap) {
      if (!fromMap.has(key)) {
        result.addedEndpoints.push({
          changeType: ChangeType.ADDED,
          method: endpoint.method,
          path: endpoint.path,
          summary: endpoint.summary || undefined,
          changes: [],
          breakingChanges: [],
        });
      }
    }

    // Find removed endpoints
    for (const [key, endpoint] of fromMap) {
      if (!toMap.has(key)) {
        result.removedEndpoints.push({
          changeType: ChangeType.REMOVED,
          method: endpoint.method,
          path: endpoint.path,
          summary: endpoint.summary || undefined,
          changes: [],
          breakingChanges: [
            {
              type: BreakingChangeType.ENDPOINT_REMOVED,
              description: `Endpoint ${endpoint.method} ${endpoint.path} was removed`,
              severity: 'critical',
            },
          ],
        });
        result.breakingChangesCount++;
      }
    }

    // Find modified endpoints
    for (const [key, fromEndpoint] of fromMap) {
      const toEndpoint = toMap.get(key);

      if (toEndpoint) {
        const diff = this.compareEndpoints(fromEndpoint, toEndpoint);

        if (diff.changes.length > 0 || diff.breakingChanges.length > 0) {
          result.modifiedEndpoints.push(diff);
          result.breakingChangesCount += diff.breakingChanges.length;
        } else {
          result.unchangedCount++;
        }
      }
    }

    // Calculate summary
    result.summary = {
      totalChanges:
        result.addedEndpoints.length +
        result.removedEndpoints.length +
        result.modifiedEndpoints.length,
      additions: result.addedEndpoints.length,
      deletions: result.removedEndpoints.length,
      modifications: result.modifiedEndpoints.length,
      breakingChanges: result.breakingChangesCount,
    };

    this.logger.log(
      `API diff completed: ${result.summary.totalChanges} changes, ${result.summary.breakingChanges} breaking`,
    );

    return result;
  }

  /**
   * Get list of available versions for an API
   */
  async getVersions(apiId: string): Promise<
    Array<{
      version: string;
      isLatest: boolean;
      createdAt: Date;
      endpointCount: number;
    }>
  > {
    // Get the base API
    const baseApi = await this.prisma.apiDefinition.findUnique({
      where: { id: apiId },
    });

    if (!baseApi) {
      throw new NotFoundException(`API with ID ${apiId} not found`);
    }

    // Find all versions with the same workspace and slug
    const versions = await this.prisma.apiDefinition.findMany({
      where: {
        workspaceId: baseApi.workspaceId,
        slug: baseApi.slug,
      },
      include: {
        _count: {
          select: { endpoints: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return versions.map((v) => ({
      version: v.version,
      isLatest: v.isLatest,
      createdAt: v.createdAt,
      endpointCount: v._count.endpoints,
    }));
  }

  /**
   * Load API by version
   */
  private async loadApiVersion(apiId: string, version: string) {
    // Get the base API to get workspace and slug
    const baseApi = await this.prisma.apiDefinition.findUnique({
      where: { id: apiId },
    });

    if (!baseApi) {
      return null;
    }

    // Find the specific version
    return this.prisma.apiDefinition.findFirst({
      where: {
        workspaceId: baseApi.workspaceId,
        slug: baseApi.slug,
        version,
      },
      include: {
        endpoints: true,
      },
    });
  }

  /**
   * Generate unique key for endpoint
   */
  private getEndpointKey(endpoint: any): string {
    return `${endpoint.method}:${endpoint.path}`;
  }

  /**
   * Compare two endpoints and find differences
   */
  private compareEndpoints(fromEndpoint: any, toEndpoint: any): EndpointDiff {
    const diff: EndpointDiff = {
      changeType: ChangeType.MODIFIED,
      method: fromEndpoint.method,
      path: fromEndpoint.path,
      summary: toEndpoint.summary || undefined,
      changes: [],
      breakingChanges: [],
    };

    // Compare summary
    if (fromEndpoint.summary !== toEndpoint.summary) {
      diff.changes.push({
        field: 'summary',
        oldValue: fromEndpoint.summary,
        newValue: toEndpoint.summary,
        changeType: ChangeType.MODIFIED,
      });
    }

    // Compare enabled status
    if (fromEndpoint.enabled !== toEndpoint.enabled) {
      diff.changes.push({
        field: 'enabled',
        oldValue: fromEndpoint.enabled,
        newValue: toEndpoint.enabled,
        changeType: ChangeType.MODIFIED,
      });

      if (!toEndpoint.enabled && fromEndpoint.enabled) {
        diff.breakingChanges.push({
          type: BreakingChangeType.ENDPOINT_REMOVED,
          description: 'Endpoint was disabled',
          severity: 'major',
        });
      }
    }

    // Compare responses
    const fromResponses = fromEndpoint.responses as any[];
    const toResponses = toEndpoint.responses as any[];

    if (JSON.stringify(fromResponses) !== JSON.stringify(toResponses)) {
      diff.changes.push({
        field: 'responses',
        oldValue: fromResponses,
        newValue: toResponses,
        changeType: ChangeType.MODIFIED,
      });

      // Check for removed response status codes
      const fromStatuses = new Set(fromResponses.map((r) => r.status));
      const toStatuses = new Set(toResponses.map((r) => r.status));

      for (const status of fromStatuses) {
        if (!toStatuses.has(status)) {
          diff.breakingChanges.push({
            type: BreakingChangeType.RESPONSE_STATUS_CHANGED,
            description: `Response status ${status} was removed`,
            severity: 'major',
          });
        }
      }
    }

    // Compare request schema
    if (
      JSON.stringify(fromEndpoint.requestSchema) !==
      JSON.stringify(toEndpoint.requestSchema)
    ) {
      diff.changes.push({
        field: 'requestSchema',
        oldValue: fromEndpoint.requestSchema,
        newValue: toEndpoint.requestSchema,
        changeType: ChangeType.MODIFIED,
      });

      // Check for added required fields (breaking)
      if (fromEndpoint.requestSchema && toEndpoint.requestSchema) {
        const fromRequired =
          (fromEndpoint.requestSchema as any).required || [];
        const toRequired = (toEndpoint.requestSchema as any).required || [];

        for (const field of toRequired) {
          if (!fromRequired.includes(field)) {
            diff.breakingChanges.push({
              type: BreakingChangeType.REQUIRED_PARAM_ADDED,
              description: `Required parameter '${field}' was added`,
              severity: 'critical',
            });
          }
        }
      }
    }

    return diff;
  }
}

