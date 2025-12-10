// backend/src/openapi/openapi-parser.service.ts
import { Injectable } from '@nestjs/common';
import SwaggerParser from '@apidevtools/swagger-parser';
import { ImportExportApiFile } from '../shared/types/api-import-export';

@Injectable()
export class OpenApiParserService {
  async parseOpenApiSpec(spec: any): Promise<ImportExportApiFile> {
    // Validar y dereferenciar el spec
    const api = await SwaggerParser.validate(spec);

    const info = api.info || {};
    const paths = api.paths || {};

    // Extraer metadata
    const apiMeta = {
      name: info.title || 'Imported API',
      slug: this.slugify(info.title || 'imported-api'),
      version: info.version || '1.0.0',
      basePath: api.basePath || '/',
      description: info.description,
      isActive: true,
      tags: [],
    };

    // Convertir paths a endpoints
    const endpoints: any[] = [];

    for (const [path, pathItem] of Object.entries(paths as any)) {
      const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

      for (const method of methods) {
        const operation = pathItem[method];
        if (!operation) continue;

        const endpoint = {
          method: method.toUpperCase(),
          path,
          summary: operation.summary || operation.operationId || `${method} ${path}`,
          requestSchema: this.buildRequestSchema(operation),
          responses: this.buildResponses(operation.responses || {}),
          delayMs: 0,
          enabled: true,
        };

        endpoints.push(endpoint);
      }
    }

    return {
      type: 'mock-api-definition',
      schemaVersion: '1.0.0',
      api: apiMeta,
      endpoints,
    };
  }

  private buildRequestSchema(operation: any): any {
    const schema: any = {};

    // Query parameters
    const queryParams = (operation.parameters || []).filter(
      (p: any) => p.in === 'query',
    );
    if (queryParams.length > 0) {
      schema.query = {
        type: 'object',
        properties: {},
        required: [],
      };
      for (const param of queryParams) {
        schema.query.properties[param.name] = param.schema || { type: 'string' };
        if (param.required) {
          schema.query.required.push(param.name);
        }
      }
    }

    // Body (si existe requestBody)
    if (operation.requestBody) {
      const content = operation.requestBody.content || {};
      const jsonContent = content['application/json'];
      if (jsonContent && jsonContent.schema) {
        schema.body = jsonContent.schema;
      }
    }

    return Object.keys(schema).length > 0 ? schema : undefined;
  }

  private buildResponses(responses: any): any[] {
    const result: any[] = [];

    for (const [status, responseObj] of Object.entries(responses as any)) {
      const statusCode = status === 'default' ? 200 : parseInt(status, 10);

      const content = (responseObj as any).content || {};
      const jsonContent = content['application/json'];

      let body: any = { message: 'OK' };

      if (jsonContent && jsonContent.example) {
        body = jsonContent.example;
      } else if (jsonContent && jsonContent.schema) {
        // Generar un ejemplo simple desde el schema
        body = this.generateExampleFromSchema(jsonContent.schema);
      }

      result.push({
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
        body,
        isDefault: status === '200' || status === 'default',
      });
    }

    if (result.length === 0) {
      result.push({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: { message: 'OK' },
        isDefault: true,
      });
    }

    return result;
  }

  private generateExampleFromSchema(schema: any): any {
    if (!schema) return {};

    if (schema.type === 'object') {
      const result: any = {};
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          result[key] = this.generateExampleFromSchema(propSchema);
        }
      }
      return result;
    }

    if (schema.type === 'array') {
      const itemExample = this.generateExampleFromSchema(schema.items || {});
      return [itemExample];
    }

    if (schema.type === 'string') {
      return schema.example || 'string';
    }

    if (schema.type === 'number' || schema.type === 'integer') {
      return schema.example || 0;
    }

    if (schema.type === 'boolean') {
      return schema.example || false;
    }

    return {};
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

