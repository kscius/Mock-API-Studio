import { Test, TestingModule } from '@nestjs/testing';
import { InsomniaExportService } from './insomnia-export.service';

describe('InsomniaExportService', () => {
  let service: InsomniaExportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InsomniaExportService],
    }).compile();

    service = module.get<InsomniaExportService>(InsomniaExportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCollection', () => {
    it('should generate a valid Insomnia collection', () => {
      const mockApi = {
        id: 'api-1',
        name: 'Test API',
        slug: 'test-api',
        description: 'Test API Description',
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
                headers: {},
              },
            ],
            requestSchema: null,
          } as any,
        ],
      } as any;

      const baseUrl = 'http://localhost:3000';
      const collection = service.generateCollection(mockApi, baseUrl);

      expect(collection._type).toBe('export');
      expect(collection.__export_format).toBe(4);
      expect(collection.resources).toBeDefined();
      expect(collection.resources.length).toBeGreaterThan(0);
    });

    it('should create workspace and environment resources', () => {
      const mockApi = {
        id: 'api-1',
        name: 'Test API',
        slug: 'test-api',
        endpoints: [],
      } as any;

      const collection = service.generateCollection(mockApi, 'http://localhost:3000');
      
      const workspace = collection.resources.find(r => r._type === 'workspace');
      const environment = collection.resources.find(r => r._type === 'environment');

      expect(workspace).toBeDefined();
      expect(workspace?.name).toBe('Test API');
      expect(environment).toBeDefined();
    });

    it('should handle POST requests with body', () => {
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
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
          } as any,
        ],
      } as any;

      const collection = service.generateCollection(mockApi, 'http://localhost:3000');
      const request = collection.resources.find(r => r._type === 'request');
      
      expect(request?.body).toBeDefined();
      expect(request?.body?.mimeType).toBe('application/json');
    });
  });
});

