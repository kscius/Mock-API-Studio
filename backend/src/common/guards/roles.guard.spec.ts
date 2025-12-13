import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { WorkspacesService } from '../../workspaces/workspaces.service';
import { Role } from '@prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let workspacesService: WorkspacesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
            get: jest.fn(),
          },
        },
        {
          provide: WorkspacesService,
          useValue: {
            getUserRole: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
    workspacesService = module.get<WorkspacesService>(WorkspacesService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access if no roles are required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockExecutionContext({});
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should throw ForbiddenException if user is not authenticated', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = createMockExecutionContext({ user: null });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should allow global admin to bypass workspace checks', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    jest.spyOn(reflector, 'get').mockReturnValue('workspaceId');

    const context = createMockExecutionContext({
      user: { id: 'user1', role: 'admin' },
      params: { workspaceId: 'ws1' },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(workspacesService.getUserRole).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException if workspace ID is not provided', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.EDITOR]);
    jest.spyOn(reflector, 'get').mockReturnValue('workspaceId');

    const context = createMockExecutionContext({
      user: { id: 'user1', role: 'user' },
      params: {},
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user is not a member of workspace', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.VIEWER]);
    jest.spyOn(reflector, 'get').mockReturnValue('workspaceId');
    jest.spyOn(workspacesService, 'getUserRole').mockResolvedValue(null);

    const context = createMockExecutionContext({
      user: { id: 'user1', role: 'user' },
      params: { workspaceId: 'ws1' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should allow user with exact required role', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.EDITOR]);
    jest.spyOn(reflector, 'get').mockReturnValue('workspaceId');
    jest.spyOn(workspacesService, 'getUserRole').mockResolvedValue(Role.EDITOR);

    const context = createMockExecutionContext({
      user: { id: 'user1', role: 'user' },
      params: { workspaceId: 'ws1' },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow user with higher role (ADMIN can do EDITOR tasks)', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.EDITOR]);
    jest.spyOn(reflector, 'get').mockReturnValue('workspaceId');
    jest.spyOn(workspacesService, 'getUserRole').mockResolvedValue(Role.ADMIN);

    const context = createMockExecutionContext({
      user: { id: 'user1', role: 'user' },
      params: { workspaceId: 'ws1' },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should deny user with lower role (VIEWER cannot do EDITOR tasks)', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.EDITOR]);
    jest.spyOn(reflector, 'get').mockReturnValue('workspaceId');
    jest.spyOn(workspacesService, 'getUserRole').mockResolvedValue(Role.VIEWER);

    const context = createMockExecutionContext({
      user: { id: 'user1', role: 'user' },
      params: { workspaceId: 'ws1' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  function createMockExecutionContext(data: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: data.user,
          params: data.params || {},
          body: data.body || {},
          query: data.query || {},
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  }
});

