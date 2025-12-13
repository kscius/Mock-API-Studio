import { SetMetadata } from '@nestjs/common';
import { ApiScope } from '../constants/scopes';
import { SCOPES_KEY } from '../guards/scopes.guard';

export const RequireScopes = (...scopes: ApiScope[]) => SetMetadata(SCOPES_KEY, scopes);

