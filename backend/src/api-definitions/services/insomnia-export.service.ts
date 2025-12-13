import { Injectable } from '@nestjs/common';
import { ApiDefinition, ApiEndpoint } from '@prisma/client';

interface InsomniaCollection {
  _type: string;
  __export_format: number;
  __export_date: string;
  __export_source: string;
  resources: InsomniaResource[];
}

interface InsomniaResource {
  _id: string;
  _type: string;
  parentId?: string;
  name: string;
  description?: string;
  url?: string;
  method?: string;
  headers?: Array<{ name: string; value: string }>;
  body?: {
    mimeType: string;
    text: string;
  };
  parameters?: Array<{ name: string; value: string }>;
  authentication?: any;
  metaSortKey?: number;
  isPrivate?: boolean;
  settingStoreCookies?: boolean;
  settingSendCookies?: boolean;
  settingDisableRenderRequestBody?: boolean;
  settingEncodeUrl?: boolean;
  settingRebuildPath?: boolean;
  settingFollowRedirects?: string;
}

@Injectable()
export class InsomniaExportService {
  generateCollection(
    api: ApiDefinition & { endpoints: ApiEndpoint[] },
    baseUrl: string,
  ): InsomniaCollection {
    const workspaceId = `wrk_${this.generateId()}`;
    const environmentId = `env_${this.generateId()}`;
    
    const resources: InsomniaResource[] = [
      // Workspace
      {
        _id: workspaceId,
        _type: 'workspace',
        name: api.name,
        description: api.description || `Mock API for ${api.name}`,
      },
      // Environment
      {
        _id: environmentId,
        _type: 'environment',
        parentId: workspaceId,
        name: 'Base Environment',
        data: {
          baseUrl: `${baseUrl}/mock/${api.slug}`,
          apiSlug: api.slug,
        },
      },
      // Request folder
      {
        _id: `fld_${this.generateId()}`,
        _type: 'request_group',
        parentId: workspaceId,
        name: 'Endpoints',
        description: api.description,
      },
    ];

    // Add requests
    api.endpoints.forEach((endpoint, index) => {
      resources.push(this.generateRequest(endpoint, workspaceId, baseUrl, index));
    });

    return {
      _type: 'export',
      __export_format: 4,
      __export_date: new Date().toISOString(),
      __export_source: 'mock-api-studio',
      resources,
    };
  }

  private generateRequest(
    endpoint: ApiEndpoint,
    parentId: string,
    baseUrl: string,
    index: number,
  ): InsomniaResource {
    const responses = endpoint.responses as any[];
    const requestSchema = endpoint.requestSchema as any;
    const defaultResponse = responses.find((r) => r.isDefault) || responses[0];

    // Replace path params with Insomnia syntax: :id -> {{ _.id }}
    const insomniaPath = endpoint.path.replace(/:(\w+)/g, '{{ _.$1 }}');

    return {
      _id: `req_${this.generateId()}`,
      _type: 'request',
      parentId,
      name: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
      description: `Status: ${defaultResponse?.status || 200}`,
      url: `{{ _.baseUrl }}${insomniaPath}`,
      method: endpoint.method,
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
      ...(endpoint.method !== 'GET' &&
        requestSchema && {
          body: {
            mimeType: 'application/json',
            text: JSON.stringify(
              this.generateExampleFromSchema(requestSchema),
              null,
              2,
            ),
          },
        }),
      parameters: [],
      authentication: {},
      metaSortKey: -1000000000 + index * 100,
      isPrivate: false,
      settingStoreCookies: true,
      settingSendCookies: true,
      settingDisableRenderRequestBody: false,
      settingEncodeUrl: true,
      settingRebuildPath: true,
      settingFollowRedirects: 'global',
    };
  }

  private generateExampleFromSchema(schema: any): any {
    if (!schema || !schema.properties) {
      return {};
    }

    const example: any = {};
    for (const [key, prop] of Object.entries(schema.properties as any)) {
      if (prop.example) {
        example[key] = prop.example;
      } else if (prop.type === 'string') {
        example[key] = `example_${key}`;
      } else if (prop.type === 'number' || prop.type === 'integer') {
        example[key] = 123;
      } else if (prop.type === 'boolean') {
        example[key] = true;
      } else if (prop.type === 'array') {
        example[key] = [];
      } else if (prop.type === 'object') {
        example[key] = {};
      }
    }
    return example;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}

