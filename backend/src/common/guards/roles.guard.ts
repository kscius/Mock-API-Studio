import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { WorkspacesService } from '../../workspaces/workspaces.service';

export const ROLES_KEY = 'roles';
export const WORKSPACE_ID_PARAM = 'workspaceIdParam';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private workspacesService: WorkspacesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Global admins bypass workspace-level checks
    if (user.role === 'admin') {
      return true;
    }

    // Get workspace ID from request params or body
    const workspaceIdParam = this.reflector.get<string>(
      WORKSPACE_ID_PARAM,
      context.getHandler(),
    ) || 'workspaceId';

    const workspaceId = request.params[workspaceIdParam] || 
                        request.body?.workspaceId || 
                        request.query?.workspaceId;

    if (!workspaceId) {
      throw new ForbiddenException('Workspace ID not provided');
    }

    // Check user's role in the workspace
    const userRole = await this.workspacesService.getUserRole(workspaceId, user.id);

    if (!userRole) {
      throw new ForbiddenException('User is not a member of this workspace');
    }

    // Check if user has any of the required roles
    const hasRequiredRole = requiredRoles.some((role) =>
      this.hasPermission(userRole, role),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Required role: ${requiredRoles.join(' or ')}. Current role: ${userRole}`,
      );
    }

    // Attach user's workspace role to request for later use
    request.workspaceRole = userRole;

    return true;
  }

  private hasPermission(userRole: Role, requiredRole: Role): boolean {
    const roleHierarchy = {
      [Role.ADMIN]: 3,
      [Role.EDITOR]: 2,
      [Role.VIEWER]: 1,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }
}

