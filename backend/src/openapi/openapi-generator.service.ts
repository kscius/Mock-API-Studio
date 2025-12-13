// backend/src/openapi/openapi-generator.service.ts
import { Injectable } from '@nestjs/common';

interface ApiDefinition {
  id: string;
  name: string;
  slug: string;
  version: string;
  basePath: string;
  description?: string;
  endpoints: ApiEndpoint[];
}

interface ApiEndpoint {
  id: string;
  method: string;
  path: string;
  summary?: string;
  requestSchema?: any;
  responses: any[];
  enabled: boolean;
  type: string;
  operationName?: string;
  operationType?: string;
}

@Injectable()
export class OpenApiGeneratorService {
  /**
   * Generate OpenAPI 3.0 specification from ApiDefinition
   */
  generateOpenApiSpec(api: ApiDefinition, mockBaseUrl: string): any {
    const spec = {
      openapi: '3.0.3',
      info: {
        title: api.name,
        description: api.description || `Mock API for ${api.name}`,
        version: api.version || '1.0.0',
      },
      servers: [
        {
          url: `${mockBaseUrl}/mock/${api.slug}`,
          description: 'Mock Server',
        },
      ],
      paths: this.generatePaths(api.endpoints),
      components: {
        schemas: this.extractSchemas(api.endpoints),
      },
    };

    return spec;
  }

  /**
   * Generate paths object from endpoints
   */
  private generatePaths(endpoints: ApiEndpoint[]): any {
    const paths: any = {};

    // Filter out disabled endpoints and GraphQL endpoints (they have separate handling)
    const restEndpoints = endpoints.filter(
      (ep) => ep.enabled && ep.type === 'REST',
    );

    for (const endpoint of restEndpoints) {
      const path = endpoint.path;
      
      if (!paths[path]) {
        paths[path] = {};
      }

      const method = endpoint.method.toLowerCase();
      paths[path][method] = this.generateOperation(endpoint);
    }

    return paths;
  }

  /**
   * Generate operation object for an endpoint
   */
  private generateOperation(endpoint: ApiEndpoint): any {
    const operation: any = {
      summary: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
      operationId: endpoint.id,
      parameters: this.extractParameters(endpoint.path),
      responses: this.generateResponses(endpoint.responses),
    };

    // Add request body if there's a schema
    if (endpoint.requestSchema && endpoint.method !== 'GET') {
      operation.requestBody = {
        description: 'Request body',
        required: true,
        content: {
          'application/json': {
            schema: endpoint.requestSchema,
          },
        },
      };
    }

    return operation;
  }

  /**
   * Extract path parameters from endpoint path
   * Example: /users/:id/posts/:postId -> [{name: 'id'}, {name: 'postId'}]
   */
  private extractParameters(path: string): any[] {
    const parameters: any[] = [];
    
    // Match :paramName patterns
    const paramMatches = path.match(/:([a-zA-Z_][a-zA-Z0-9_]*)/g);
    
    if (paramMatches) {
      for (const match of paramMatches) {
        const paramName = match.substring(1); // Remove the ':'
        parameters.push({
          name: paramName,
          in: 'path',
          required: true,
          schema: {
            type: 'string',
          },
          description: `Path parameter: ${paramName}`,
        });
      }
    }

    return parameters;
  }

  /**
   * Generate responses object from endpoint responses
   */
  private generateResponses(responses: any[]): any {
    const responsesObj: any = {};

    if (!responses || responses.length === 0) {
      // Default response if none defined
      responsesObj['200'] = {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
      };
      return responsesObj;
    }

    for (const response of responses) {
      const statusCode = response.status || 200;
      const description = response.isDefault
        ? 'Default response'
        : `Response ${statusCode}`;

      responsesObj[statusCode] = {
        description,
        content: {
          'application/json': {
            schema: this.inferSchemaFromExample(response.body),
            example: response.body,
          },
        },
      };

      // Add headers if present
      if (response.headers && Object.keys(response.headers).length > 0) {
        responsesObj[statusCode].headers = {};
        for (const [headerName, headerValue] of Object.entries(response.headers)) {
          responsesObj[statusCode].headers[headerName] = {
            schema: {
              type: 'string',
            },
            example: headerValue,
          };
        }
      }
    }

    return responsesObj;
  }

  /**
   * Infer JSON schema from example object
   */
  private inferSchemaFromExample(example: any): any {
    if (example === null || example === undefined) {
      return { type: 'null' };
    }

    if (Array.isArray(example)) {
      return {
        type: 'array',
        items: example.length > 0 ? this.inferSchemaFromExample(example[0]) : {},
      };
    }

    if (typeof example === 'object') {
      const properties: any = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(example)) {
        properties[key] = this.inferSchemaFromExample(value);
        required.push(key);
      }

      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }

    // Primitive types
    if (typeof example === 'string') {
      return { type: 'string' };
    }
    if (typeof example === 'number') {
      return { type: Number.isInteger(example) ? 'integer' : 'number' };
    }
    if (typeof example === 'boolean') {
      return { type: 'boolean' };
    }

    return { type: 'string' };
  }

  /**
   * Extract common schemas from endpoints (for reusability)
   */
  private extractSchemas(endpoints: ApiEndpoint[]): any {
    const schemas: any = {};

    // For now, we keep schemas inline in responses
    // In the future, we could extract common patterns here

    return schemas;
  }

  /**
   * Generate a simplified OpenAPI spec (just paths and basic info)
   */
  generateSimplifiedSpec(api: ApiDefinition, mockBaseUrl: string): any {
    return {
      openapi: '3.0.3',
      info: {
        title: api.name,
        version: api.version,
      },
      servers: [
        {
          url: `${mockBaseUrl}/mock/${api.slug}`,
        },
      ],
      paths: this.generatePaths(api.endpoints),
    };
  }
}

