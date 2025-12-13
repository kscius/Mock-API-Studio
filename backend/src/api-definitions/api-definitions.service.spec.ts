import { Test, TestingModule } from '@nestjs/testing';
import { ApiDefinitionsService } from './api-definitions.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

describe('ApiDefinitionsService', () => {
  let service: ApiDefinitionsService;
  let prismaService: PrismaService;
  let redisService: RedisService;

  const mockPrismaService = {
    apiDefinition: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    apiEndpoint: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiDefinitionsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<ApiDefinitionsService>(ApiDefinitionsService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all API definitions', async () => {
      const mockApis = [
        { id: '1', name: 'Test API', slug: 'test-api', workspaceId: 'ws-1' },
      ];
      mockPrismaService.apiDefinition.findMany.mockResolvedValue(mockApis);

      const result = await service.findAll();

      expect(result).toEqual(mockApis);
      expect(prismaService.apiDefinition.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: { endpoints: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by workspaceId when provided', async () => {
      const mockApis = [
        { id: '1', name: 'Test API', slug: 'test-api', workspaceId: 'ws-1' },
      ];
      mockPrismaService.apiDefinition.findMany.mockResolvedValue(mockApis);

      const result = await service.findAll('ws-1');

      expect(result).toEqual(mockApis);
      expect(prismaService.apiDefinition.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1' },
        include: { endpoints: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('create', () => {
    it('should create an API definition', async () => {
      const createDto = {
        workspaceId: 'ws-1',
        name: 'Test API',
        slug: 'test-api',
        version: '1.0.0',
        basePath: '/',
      };
      const mockApi = { id: '1', ...createDto };
      mockPrismaService.apiDefinition.create.mockResolvedValue(mockApi);

      const result = await service.create(createDto);

      expect(result).toEqual(mockApi);
      expect(prismaService.apiDefinition.create).toHaveBeenCalled();
      expect(redisService.del).toHaveBeenCalledWith('mock:api:ws-1:test-api');
    });
  });

  describe('createEndpoint', () => {
    it('should create an endpoint', async () => {
      const createDto = {
        method: 'GET',
        path: '/users',
        responses: [{ status: 200, body: { message: 'OK' }, isDefault: true }],
      };
      const mockEndpoint = { id: 'ep-1', apiId: 'api-1', ...createDto };
      const mockApi = { id: 'api-1', slug: 'test-api', workspaceId: 'ws-1' };

      mockPrismaService.apiEndpoint.create.mockResolvedValue(mockEndpoint);
      mockPrismaService.apiDefinition.findUnique.mockResolvedValue(mockApi);

      const result = await service.createEndpoint('api-1', createDto);

      expect(result).toEqual(mockEndpoint);
      expect(prismaService.apiEndpoint.create).toHaveBeenCalled();
    });
  });

  describe('duplicateEndpoint', () => {
    it('should duplicate an endpoint with auto-generated path', async () => {
      const originalEndpoint = {
        id: 'ep-1',
        apiId: 'api-1',
        method: 'GET',
        path: '/users',
        summary: 'Get users',
        requestSchema: null,
        responses: [{ status: 200, body: { users: [] }, isDefault: true }],
        delayMs: 0,
        enabled: true,
        type: 'REST',
        operationName: null,
        operationType: null,
        api: { id: 'api-1', slug: 'test-api', workspaceId: 'ws-1' },
      };

      const duplicatedEndpoint = {
        id: 'ep-2',
        apiId: 'api-1',
        method: 'GET',
        path: '/users-copy',
        summary: 'Get users (Copy)',
        requestSchema: null,
        responses: [{ status: 200, body: { users: [] }, isDefault: true }],
        delayMs: 0,
        enabled: true,
        type: 'REST',
        operationName: null,
        operationType: null,
      };

      mockPrismaService.apiEndpoint.findUnique.mockResolvedValue(originalEndpoint);
      mockPrismaService.apiEndpoint.findFirst.mockResolvedValue(null); // No existing path
      mockPrismaService.apiEndpoint.create.mockResolvedValue(duplicatedEndpoint);

      const result = await service.duplicateEndpoint('ep-1');

      expect(result).toEqual(duplicatedEndpoint);
      expect(prismaService.apiEndpoint.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          apiId: 'api-1',
          method: 'GET',
          path: '/users-copy',
          summary: 'Get users (Copy)',
        }),
      });
      expect(redisService.del).toHaveBeenCalledWith('mock:api:ws-1:test-api');
    });

    it('should duplicate an endpoint with custom path', async () => {
      const originalEndpoint = {
        id: 'ep-1',
        apiId: 'api-1',
        method: 'GET',
        path: '/users',
        summary: 'Get users',
        requestSchema: null,
        responses: [{ status: 200, body: { users: [] }, isDefault: true }],
        delayMs: 0,
        enabled: true,
        type: 'REST',
        operationName: null,
        operationType: null,
        api: { id: 'api-1', slug: 'test-api', workspaceId: 'ws-1' },
      };

      const duplicatedEndpoint = {
        id: 'ep-2',
        apiId: 'api-1',
        method: 'POST',
        path: '/users/v2',
        summary: 'Create users v2',
        requestSchema: null,
        responses: [{ status: 200, body: { users: [] }, isDefault: true }],
        delayMs: 0,
        enabled: true,
        type: 'REST',
        operationName: null,
        operationType: null,
      };

      mockPrismaService.apiEndpoint.findUnique.mockResolvedValue(originalEndpoint);
      mockPrismaService.apiEndpoint.create.mockResolvedValue(duplicatedEndpoint);

      const result = await service.duplicateEndpoint('ep-1', {
        path: '/users/v2',
        method: 'POST',
        summary: 'Create users v2',
      });

      expect(result).toEqual(duplicatedEndpoint);
      expect(prismaService.apiEndpoint.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          path: '/users/v2',
          method: 'POST',
          summary: 'Create users v2',
        }),
      });
    });

    it('should throw error if endpoint not found', async () => {
      mockPrismaService.apiEndpoint.findUnique.mockResolvedValue(null);

      await expect(service.duplicateEndpoint('invalid-id')).rejects.toThrow('Endpoint not found');
    });
  });
});

