import { Test, TestingModule } from '@nestjs/testing';
import { MockRuntimeService } from './mock-runtime.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { ValidationService } from '../shared/services/validation.service';
import { WebhooksService } from '../webhooks/webhooks.service';

describe('MockRuntimeService', () => {
  let service: MockRuntimeService;

  const mockPrismaService = {
    apiDefinition: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockValidationService = {
    validateFullRequest: jest.fn(),
  };

  const mockWebhooksService = {
    fireWebhooks: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MockRuntimeService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: ValidationService, useValue: mockValidationService },
        { provide: WebhooksService, useValue: mockWebhooksService },
      ],
    }).compile();

    service = module.get<MockRuntimeService>(MockRuntimeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleRequest', () => {
    it('should return a mock response', async () => {
      const mockApi = {
        id: 'api-1',
        slug: 'test-api',
        isActive: true,
        endpoints: [
          {
            id: 'ep-1',
            method: 'GET',
            path: '/users',
            enabled: true,
            responses: [
              { status: 200, body: { users: [] }, isDefault: true },
            ],
            delayMs: 0,
          },
        ],
      };

      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.apiDefinition.findUnique.mockResolvedValue(mockApi);

      const result = await service.handleRequest({
        apiSlug: 'test-api',
        method: 'GET',
        path: '/users',
        body: null,
        query: {},
        headers: {},
      });

      expect(result.statusCode).toBe(200);
      expect(result.body).toEqual({ users: [] });
    });

    it('should throw NotFoundException when endpoint not found', async () => {
      const mockApi = {
        id: 'api-1',
        slug: 'test-api',
        isActive: true,
        endpoints: [],
      };

      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.apiDefinition.findUnique.mockResolvedValue(mockApi);

      await expect(
        service.handleRequest({
          apiSlug: 'test-api',
          method: 'GET',
          path: '/nonexistent',
          body: null,
          query: {},
          headers: {},
        }),
      ).rejects.toThrow('Endpoint not found');
    });
  });
});

