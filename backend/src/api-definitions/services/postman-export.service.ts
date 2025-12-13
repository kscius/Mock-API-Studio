import { Injectable } from '@nestjs/common';
import { ApiDefinition, ApiEndpoint } from '@prisma/client';

interface PostmanCollection {
  info: {
    name: string;
    description?: string;
    schema: string;
  };
  item: PostmanItem[];
  variable?: PostmanVariable[];
}

interface PostmanItem {
  name: string;
  request: {
    method: string;
    header: PostmanHeader[];
    url: PostmanUrl | string;
    body?: {
      mode: string;
      raw: string;
      options?: {
        raw: {
          language: string;
        };
      };
    };
  };
  response: PostmanResponse[];
}

interface PostmanUrl {
  raw: string;
  host: string[];
  path: string[];
  variable?: PostmanVariable[];
  query?: Array<{ key: string; value: string; description?: string }>;
}

interface PostmanHeader {
  key: string;
  value: string;
  type?: string;
}

interface PostmanVariable {
  key: string;
  value: string;
  type?: string;
}

interface PostmanResponse {
  name: string;
  originalRequest: any;
  status: string;
  code: number;
  _postman_previewlanguage: string;
  header: PostmanHeader[];
  cookie: any[];
  body: string;
}

@Injectable()
export class PostmanExportService {
  generateCollection(
    api: ApiDefinition & { endpoints: ApiEndpoint[] },
    baseUrl: string,
  ): PostmanCollection {
    return {
      info: {
        name: api.name,
        description: api.description || `Mock API for ${api.name}`,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: api.endpoints.map((endpoint) => this.generateItem(endpoint, api, baseUrl)),
      variable: [
        {
          key: 'baseUrl',
          value: `${baseUrl}/mock/${api.slug}`,
          type: 'string',
        },
        {
          key: 'apiSlug',
          value: api.slug,
          type: 'string',
        },
      ],
    };
  }

  private generateItem(
    endpoint: ApiEndpoint,
    api: ApiDefinition,
    baseUrl: string,
  ): PostmanItem {
    const responses = endpoint.responses as any[];
    const requestSchema = endpoint.requestSchema as any;

    // Parse URL and extract path variables
    const pathVariables = this.extractPathVariables(endpoint.path);
    const cleanPath = endpoint.path.replace(/:\w+/g, (match) => `{{${match.slice(1)}}}`);

    return {
      name: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
      request: {
        method: endpoint.method,
        header: [
          {
            key: 'Content-Type',
            value: 'application/json',
            type: 'text',
          },
        ],
        url: {
          raw: `{{baseUrl}}${cleanPath}`,
          host: ['{{baseUrl}}'],
          path: cleanPath.split('/').filter((p) => p),
          variable: pathVariables.map((varName) => ({
            key: varName,
            value: `example_${varName}`,
            type: 'string',
          })),
        },
        ...(endpoint.method !== 'GET' &&
          requestSchema && {
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                this.generateExampleFromSchema(requestSchema),
                null,
                2,
              ),
              options: {
                raw: {
                  language: 'json',
                },
              },
            },
          }),
      },
      response: responses.map((response, index) =>
        this.generateResponse(response, endpoint, api, index),
      ),
    };
  }

  private extractPathVariables(path: string): string[] {
    const matches = path.match(/:(\w+)/g);
    return matches ? matches.map((match) => match.slice(1)) : [];
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

  private generateResponse(
    response: any,
    endpoint: ApiEndpoint,
    api: ApiDefinition,
    index: number,
  ): PostmanResponse {
    const headers = response.headers || {};
    const bodyString =
      typeof response.body === 'string'
        ? response.body
        : JSON.stringify(response.body, null, 2);

    return {
      name: response.isDefault ? 'Default Response' : `Response ${index + 1}`,
      originalRequest: {
        method: endpoint.method,
        header: [
          {
            key: 'Content-Type',
            value: 'application/json',
            type: 'text',
          },
        ],
        url: {
          raw: `{{baseUrl}}${endpoint.path}`,
          host: ['{{baseUrl}}'],
          path: endpoint.path.split('/').filter((p) => p),
        },
      },
      status: this.getStatusText(response.status),
      code: response.status,
      _postman_previewlanguage: 'json',
      header: Object.entries(headers).map(([key, value]) => ({
        key,
        value: String(value),
        type: 'text',
      })),
      cookie: [],
      body: bodyString,
    };
  }

  private getStatusText(code: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error',
    };
    return statusTexts[code] || 'Unknown';
  }
}

