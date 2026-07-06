import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GrpcRuntimeService } from './grpc-runtime.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

describe('GrpcRuntimeService', () => {
  let service: GrpcRuntimeService;

  const prisma = {
    apiDefinition: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const redis = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrpcRuntimeService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get(GrpcRuntimeService);
  });

  it('returns mock message for matching service/method', async () => {
    prisma.apiDefinition.findFirst.mockResolvedValue({
      id: 'api-1',
      slug: 'users-api',
      isActive: true,
      endpoints: [
        {
          enabled: true,
          type: 'GRPC',
          path: 'users.UserService',
          method: 'GetUser',
          delayMs: 0,
          operationType: 'unary',
          responses: [{ isDefault: true, body: { id: '1', name: 'Ada' } }],
        },
      ],
    });
    redis.get.mockResolvedValue(null);

    const result = await service.invoke({
      workspaceId: 'ws-1',
      apiSlug: 'users-api',
      service: 'users.UserService',
      method: 'GetUser',
      input: { id: '1' },
    });

    expect(result.message).toEqual({ id: '1', name: 'Ada' });
  });

  it('throws when grpc method is not configured', async () => {
    prisma.apiDefinition.findFirst.mockResolvedValue({
      id: 'api-1',
      slug: 'users-api',
      isActive: true,
      endpoints: [],
    });
    redis.get.mockResolvedValue(null);

    await expect(
      service.invoke({
        workspaceId: 'ws-1',
        apiSlug: 'users-api',
        service: 'users.UserService',
        method: 'Missing',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
