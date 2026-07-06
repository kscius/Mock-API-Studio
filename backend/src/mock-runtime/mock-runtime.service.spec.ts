import { Test, TestingModule } from '@nestjs/testing';
import { MockRuntimeService } from './mock-runtime.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { ConfigService } from '../config/config.service';
import { ValidationService } from '../shared/services/validation.service';
import { FakerTemplatingService } from '../shared/faker-templating.service';
import { ProxyService } from './services/proxy.service';
import { DeduplicationService } from './services/deduplication.service';
import { MockStateService } from './services/mock-state.service';
import { ChaosService } from './services/chaos.service';
import { WebhooksService } from '../webhooks/webhooks.service';

describe('MockRuntimeService', () => {
  let service: MockRuntimeService;

  const mockPrismaService = {
    apiDefinition: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockConfigService = {
    cacheTtlSeconds: 60,
  };

  const mockValidationService = {
    validateFullRequest: jest.fn(),
  };

  const mockFakerTemplatingService = {
    hasFakerPlaceholders: jest.fn().mockReturnValue(false),
    render: jest.fn((value: unknown) => value),
  };

  const mockProxyService = {
    shouldProxy: jest.fn().mockReturnValue(false),
    proxyRequest: jest.fn(),
  };

  const mockDeduplicationService = {
    checkDuplicate: jest.fn().mockResolvedValue(null),
    cacheResponse: jest.fn(),
  };

  const mockMockStateService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn(),
    increment: jest.fn(),
  };

  const mockChaosService = {
    shouldInjectChaos: jest.fn().mockReturnValue(false),
    getChaosResponse: jest.fn(),
  };

  const mockWebhooksService = {
    fireWebhooks: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MockRuntimeService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: ValidationService, useValue: mockValidationService },
        { provide: FakerTemplatingService, useValue: mockFakerTemplatingService },
        { provide: ProxyService, useValue: mockProxyService },
        { provide: DeduplicationService, useValue: mockDeduplicationService },
        { provide: MockStateService, useValue: mockMockStateService },
        { provide: ChaosService, useValue: mockChaosService },
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
            stateEnabled: false,
            cacheEnabled: false,
            chaosEnabled: false,
            deduplicationEnabled: false,
            proxyEnabled: false,
          },
        ],
      };

      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.apiDefinition.findMany.mockResolvedValue([mockApi]);
      mockPrismaService.apiDefinition.findFirst.mockResolvedValue(mockApi);

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
      mockPrismaService.apiDefinition.findMany.mockResolvedValue([mockApi]);
      mockPrismaService.apiDefinition.findFirst.mockResolvedValue(mockApi);

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
