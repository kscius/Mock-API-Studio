// backend/src/openapi/openapi-generator.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { OpenApiGeneratorService } from './openapi-generator.service';

describe('OpenApiGeneratorService', () => {
  let service: OpenApiGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenApiGeneratorService],
    }).compile();

    service = module.get<OpenApiGeneratorService>(OpenApiGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOpenApiSpec', () => {
    it('should generate valid OpenAPI spec for a simple API', () => {
      const api: any = {
        id: '1',
        name: 'Test API',
        slug: 'test-api',
        version: '1.0.0',
        basePath: '/',
        description: 'Test API Description',
        endpoints: [
          {
            id: 'ep1',
            method: 'GET',
            path: '/users',
            summary: 'Get all users',
            enabled: true,
            type: 'REST',
            responses: [
              {
                status: 200,
                isDefault: true,
                body: { users: [] },
              },
            ],
          },
        ],
      };

      const spec = service.generateOpenApiSpec(api, 'http://localhost:3000');

      expect(spec.openapi).toBe('3.0.3');
      expect(spec.info.title).toBe('Test API');
      expect(spec.info.version).toBe('1.0.0');
      expect(spec.servers).toHaveLength(1);
      expect(spec.servers[0].url).toBe('http://localhost:3000/mock/test-api');
      expect(spec.paths).toBeDefined();
      expect(spec.paths['/users']).toBeDefined();
      expect(spec.paths['/users'].get).toBeDefined();
    });

    it('should extract path parameters correctly', () => {
      const api: any = {
        id: '1',
        name: 'Test API',
        slug: 'test-api',
        version: '1.0.0',
        basePath: '/',
        endpoints: [
          {
            id: 'ep1',
            method: 'GET',
            path: '/users/:id/posts/:postId',
            enabled: true,
            type: 'REST',
            responses: [
              {
                status: 200,
                isDefault: true,
                body: {},
              },
            ],
          },
        ],
      };

      const spec = service.generateOpenApiSpec(api, 'http://localhost:3000');

      const operation = spec.paths['/users/:id/posts/:postId'].get;
      expect(operation.parameters).toHaveLength(2);
      expect(operation.parameters[0].name).toBe('id');
      expect(operation.parameters[0].in).toBe('path');
      expect(operation.parameters[0].required).toBe(true);
      expect(operation.parameters[1].name).toBe('postId');
    });

    it('should include request body for POST methods', () => {
      const api: any = {
        id: '1',
        name: 'Test API',
        slug: 'test-api',
        version: '1.0.0',
        basePath: '/',
        endpoints: [
          {
            id: 'ep1',
            method: 'POST',
            path: '/users',
            enabled: true,
            type: 'REST',
            requestSchema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
              },
              required: ['name', 'email'],
            },
            responses: [
              {
                status: 201,
                isDefault: true,
                body: { id: 1 },
              },
            ],
          },
        ],
      };

      const spec = service.generateOpenApiSpec(api, 'http://localhost:3000');

      const operation = spec.paths['/users'].post;
      expect(operation.requestBody).toBeDefined();
      expect(operation.requestBody.content['application/json'].schema).toEqual(
        api.endpoints[0].requestSchema,
      );
    });

    it('should generate multiple responses', () => {
      const api: any = {
        id: '1',
        name: 'Test API',
        slug: 'test-api',
        version: '1.0.0',
        basePath: '/',
        endpoints: [
          {
            id: 'ep1',
            method: 'GET',
            path: '/users/:id',
            enabled: true,
            type: 'REST',
            responses: [
              {
                status: 200,
                isDefault: true,
                body: { id: 1, name: 'John' },
              },
              {
                status: 404,
                body: { error: 'Not found' },
              },
            ],
          },
        ],
      };

      const spec = service.generateOpenApiSpec(api, 'http://localhost:3000');

      const operation = spec.paths['/users/:id'].get;
      expect(operation.responses['200']).toBeDefined();
      expect(operation.responses['404']).toBeDefined();
      expect(operation.responses['200'].content['application/json'].example).toEqual({
        id: 1,
        name: 'John',
      });
    });

    it('should skip disabled endpoints', () => {
      const api: any = {
        id: '1',
        name: 'Test API',
        slug: 'test-api',
        version: '1.0.0',
        basePath: '/',
        endpoints: [
          {
            id: 'ep1',
            method: 'GET',
            path: '/users',
            enabled: false,
            type: 'REST',
            responses: [],
          },
        ],
      };

      const spec = service.generateOpenApiSpec(api, 'http://localhost:3000');

      expect(Object.keys(spec.paths)).toHaveLength(0);
    });

    it('should skip GraphQL endpoints', () => {
      const api: any = {
        id: '1',
        name: 'Test API',
        slug: 'test-api',
        version: '1.0.0',
        basePath: '/',
        endpoints: [
          {
            id: 'ep1',
            method: 'POST',
            path: '/graphql',
            enabled: true,
            type: 'GRAPHQL',
            responses: [],
          },
        ],
      };

      const spec = service.generateOpenApiSpec(api, 'http://localhost:3000');

      expect(Object.keys(spec.paths)).toHaveLength(0);
    });

    it('should infer schema from example object', () => {
      const api: any = {
        id: '1',
        name: 'Test API',
        slug: 'test-api',
        version: '1.0.0',
        basePath: '/',
        endpoints: [
          {
            id: 'ep1',
            method: 'GET',
            path: '/users',
            enabled: true,
            type: 'REST',
            responses: [
              {
                status: 200,
                isDefault: true,
                body: {
                  id: 1,
                  name: 'John',
                  email: 'john@example.com',
                  active: true,
                  score: 9.5,
                },
              },
            ],
          },
        ],
      };

      const spec = service.generateOpenApiSpec(api, 'http://localhost:3000');

      const schema = spec.paths['/users'].get.responses['200'].content['application/json'].schema;
      expect(schema.type).toBe('object');
      expect(schema.properties.id.type).toBe('integer');
      expect(schema.properties.name.type).toBe('string');
      expect(schema.properties.active.type).toBe('boolean');
      expect(schema.properties.score.type).toBe('number');
    });
  });
});

