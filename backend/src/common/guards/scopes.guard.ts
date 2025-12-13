import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiScope } from '../constants/scopes';

export const SCOPES_KEY = 'scopes';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<ApiScope[]>(SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredScopes || requiredScopes.length === 0) {
      return true; // No scopes required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // If authenticated via API key
    if (user.apiKeyScopes) {
      return this.hasRequiredScopes(user.apiKeyScopes, requiredScopes);
    }

    // If authenticated via JWT (normal login), allow all scopes
    return true;
  }

  private hasRequiredScopes(userScopes: string[], requiredScopes: ApiScope[]): boolean {
    // If user has '*' scope, they have all permissions
    if (userScopes.includes(ApiScope.ALL)) {
      return true;
    }

    // Check if user has at least one of the required scopes
    return requiredScopes.some((requiredScope) => {
      // Check for exact match
      if (userScopes.includes(requiredScope)) {
        return true;
      }

      // Check for wildcard patterns (e.g., "read:*" matches "read:apis")
      const [requiredAction, requiredResource] = requiredScope.split(':');
      return userScopes.some((userScope) => {
        const [userAction, userResource] = userScope.split(':');
        
        // Match "read:*" with "read:apis"
        if (userAction === requiredAction && userResource === '*') {
          return true;
        }

        // Match "*:apis" with "read:apis"
        if (userAction === '*' && userResource === requiredResource) {
          return true;
        }

        return false;
      });
    });
  }
}

