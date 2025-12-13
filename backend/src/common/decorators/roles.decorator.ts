import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ROLES_KEY, WORKSPACE_ID_PARAM } from '../guards/roles.guard';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const WorkspaceIdParam = (paramName: string = 'workspaceId') =>
  SetMetadata(WORKSPACE_ID_PARAM, paramName);

