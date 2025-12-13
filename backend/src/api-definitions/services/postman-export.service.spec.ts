import { Test, TestingModule } from '@nestjs/testing';
import { PostmanExportService } from './postman-export.service';

describe('PostmanExportService', () => {
  let service: PostmanExportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostmanExportService],
    }).compile();

    service = module.get<PostmanExportService>(PostmanExportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCollection', () => {
    it('should generate a valid Postman collection', () => {
      const mockApi = {
        id: 'api-1',
        name: 'Test API',
        slug: 'test-api',
        description: 'Test API Description',
        version: '1.0.0',
        basePath: '/api',
        endpoints: [
          {
            id: 'ep-1',
            method: 'GET',
            path: '/users',
            summary: 'Get all users',
            responses: [
              {
                status: 200,
                isDefault: true,
                body: { users: [] },
                headers: { 'Content-Type': 'application/json' },
              },
            ],
            requestSchema: null,
          } as any,
        ],
      } as any;

      const baseUrl = 'http://localhost:3000';
      const collection = service.generateCollection(mockApi, baseUrl);

      expect(collection.info.name).toBe('Test API');
      expect(collection.info.schema).toContain('postman');
      expect(collection.item).toHaveLength(1);
      expect(collection.variable).toHaveLength(2);
      expect(collection.variable[0].key).toBe('baseUrl');
      expect(collection.variable[0].value).toBe(`${baseUrl}/mock/${mockApi.slug}`);
    });

    it('should handle path parameters correctly', () => {
      const mockApi = {
        id: 'api-1',
        name: 'Test API',
        slug: 'test-api',
        endpoints: [
          {
            id: 'ep-1',
            method: 'GET',
            path: '/users/:id',
            summary: 'Get user by ID',
            responses: [
              {
                status: 200,
                isDefault: true,
                body: { id: '123' },
                headers: {},
              },
            ],
            requestSchema: null,
          } as any,
        ],
      } as any;

      const collection = service.generateCollection(mockApi, 'http://localhost:3000');
      const item = collection.item[0];
      
      expect(item.request.url).toHaveProperty('variable');
      expect((item.request.url as any).variable).toHaveLength(1);
      expect((item.request.url as any).variable[0].key).toBe('id');
    });

    it('should include request body for POST requests', () => {
      const mockApi = {
        id: 'api-1',
        name: 'Test API',
        slug: 'test-api',
        endpoints: [
          {
            id: 'ep-1',
            method: 'POST',
            path: '/users',
            summary: 'Create user',
            responses: [
              {
                status: 201,
                isDefault: true,
                body: { id: '123' },
                headers: {},
              },
            ],
            requestSchema: {
              properties: {
                name: { type: 'string', example: 'John Doe' },
                email: { type: 'string', example: 'john@example.com' },
              },
            },
          } as any,
        ],
      } as any;

      const collection = service.generateCollection(mockApi, 'http://localhost:3000');
      const item = collection.item[0];
      
      expect(item.request.body).toBeDefined();
      expect(item.request.body?.mode).toBe('raw');
      expect(item.request.body?.options?.raw.language).toBe('json');
    });
  });
});

