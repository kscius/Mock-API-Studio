import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ScopesGuard } from './scopes.guard';
import { ApiScope } from '../constants/scopes';

describe('ScopesGuard', () => {
  let guard: ScopesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScopesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<ScopesGuard>(ScopesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access if no scopes are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockExecutionContext({ user: { id: 'user1' } });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should throw ForbiddenException if user is not authenticated', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ApiScope.READ_APIS]);

    const context = createMockExecutionContext({ user: null });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow JWT-authenticated users (no API key)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ApiScope.READ_APIS]);

    const context = createMockExecutionContext({ user: { id: 'user1' } });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow user with exact required scope via API key', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ApiScope.READ_APIS]);

    const context = createMockExecutionContext({
      user: { id: 'user1', apiKeyScopes: [ApiScope.READ_APIS] },
    });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow user with "*" (all) scope', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ApiScope.READ_APIS, ApiScope.WRITE_APIS]);

    const context = createMockExecutionContext({
      user: { id: 'user1', apiKeyScopes: [ApiScope.ALL] },
    });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should deny user without required scope', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ApiScope.WRITE_APIS]);

    const context = createMockExecutionContext({
      user: { id: 'user1', apiKeyScopes: [ApiScope.READ_APIS] },
    });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow user with wildcard action scope (read:*)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ApiScope.READ_APIS]);

    const context = createMockExecutionContext({
      user: { id: 'user1', apiKeyScopes: ['read:*'] },
    });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow user with wildcard resource scope (*:apis)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ApiScope.READ_APIS]);

    const context = createMockExecutionContext({
      user: { id: 'user1', apiKeyScopes: ['*:apis'] },
    });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow user if they have at least one of the required scopes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ApiScope.READ_APIS, ApiScope.WRITE_APIS]);

    const context = createMockExecutionContext({
      user: { id: 'user1', apiKeyScopes: [ApiScope.READ_APIS, ApiScope.READ_ENDPOINTS] },
    });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  function createMockExecutionContext(data: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: data.user,
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  }
});

