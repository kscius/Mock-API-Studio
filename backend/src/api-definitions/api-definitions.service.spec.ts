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
});

