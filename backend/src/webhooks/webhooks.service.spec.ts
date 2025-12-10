import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    webhookSubscription: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all webhooks', async () => {
      const mockWebhooks = [
        {
          id: '1',
          targetUrl: 'https://example.com',
          eventType: 'mock.request.received',
          isActive: true,
        },
      ];
      mockPrismaService.webhookSubscription.findMany.mockResolvedValue(
        mockWebhooks,
      );

      const result = await service.findAll();

      expect(result).toEqual(mockWebhooks);
    });

    it('should filter by workspaceId when provided', async () => {
      const mockWebhooks = [
        {
          id: '1',
          workspaceId: 'ws-1',
          targetUrl: 'https://example.com',
        },
      ];
      mockPrismaService.webhookSubscription.findMany.mockResolvedValue(
        mockWebhooks,
      );

      const result = await service.findAll('ws-1');

      expect(result).toEqual(mockWebhooks);
      expect(prismaService.webhookSubscription.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('create', () => {
    it('should create a webhook subscription', async () => {
      const createDto = {
        targetUrl: 'https://example.com/webhook',
        eventType: 'mock.request.received',
        workspaceId: 'ws-1',
      };
      const mockWebhook = { id: '1', ...createDto };

      mockPrismaService.webhookSubscription.create.mockResolvedValue(
        mockWebhook,
      );

      const result = await service.create(createDto);

      expect(result).toEqual(mockWebhook);
    });
  });

  describe('fireWebhooks', () => {
    it('should not throw when no webhooks exist', async () => {
      mockPrismaService.webhookSubscription.findMany.mockResolvedValue([]);

      await expect(
        service.fireWebhooks('mock.request.received', {
          event: 'mock.request.received',
          timestamp: new Date().toISOString(),
        }),
      ).resolves.not.toThrow();
    });
  });
});

