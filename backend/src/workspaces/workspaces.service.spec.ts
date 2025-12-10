import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesService } from './workspaces.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    workspace: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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
        WorkspacesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all workspaces', async () => {
      const mockWorkspaces = [
        { id: '1', name: 'Workspace 1', slug: 'ws-1' },
        { id: '2', name: 'Workspace 2', slug: 'ws-2' },
      ];
      mockPrismaService.workspace.findMany.mockResolvedValue(mockWorkspaces);

      const result = await service.findAll();

      expect(result).toEqual(mockWorkspaces);
      expect(prismaService.workspace.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { apiDefinitions: true },
          },
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a workspace by id', async () => {
      const mockWorkspace = { id: '1', name: 'Workspace 1', slug: 'ws-1' };
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);

      const result = await service.findOne('1');

      expect(result).toEqual(mockWorkspace);
    });

    it('should throw NotFoundException if workspace not found', async () => {
      mockPrismaService.workspace.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new workspace', async () => {
      const createDto = { name: 'New Workspace', slug: 'new-ws' };
      const mockWorkspace = { id: '1', ...createDto };

      mockPrismaService.workspace.findUnique.mockResolvedValue(null);
      mockPrismaService.workspace.create.mockResolvedValue(mockWorkspace);

      const result = await service.create(createDto);

      expect(result).toEqual(mockWorkspace);
      expect(prismaService.workspace.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });

    it('should throw ConflictException if slug already exists', async () => {
      const createDto = { name: 'New Workspace', slug: 'existing-slug' };
      mockPrismaService.workspace.findUnique.mockResolvedValue({
        id: '1',
        slug: 'existing-slug',
      });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update a workspace', async () => {
      const updateDto = { name: 'Updated Name' };
      const mockWorkspace = { id: '1', name: 'Updated Name', slug: 'ws-1' };

      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrismaService.workspace.update.mockResolvedValue(mockWorkspace);

      const result = await service.update('1', updateDto);

      expect(result).toEqual(mockWorkspace);
    });
  });

  describe('remove', () => {
    it('should delete a workspace', async () => {
      const mockWorkspace = { id: '1', name: 'Workspace', slug: 'ws-1' };
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrismaService.workspace.delete.mockResolvedValue(mockWorkspace);

      const result = await service.remove('1');

      expect(result).toHaveProperty('message');
      expect(prismaService.workspace.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('getDefaultWorkspace', () => {
    it('should return existing default workspace', async () => {
      const mockWorkspace = { id: '1', slug: 'default' };
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);

      const result = await service.getDefaultWorkspace();

      expect(result).toEqual(mockWorkspace);
    });

    it('should create default workspace if not exists', async () => {
      const mockWorkspace = { id: '1', slug: 'default', name: 'Default Workspace' };
      mockPrismaService.workspace.findUnique.mockResolvedValue(null);
      mockPrismaService.workspace.create.mockResolvedValue(mockWorkspace);

      const result = await service.getDefaultWorkspace();

      expect(result).toEqual(mockWorkspace);
      expect(prismaService.workspace.create).toHaveBeenCalled();
    });
  });
});

