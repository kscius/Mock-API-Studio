// backend/src/auth/guards/api-key.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    const validKey = await this.authService.validateApiKey(apiKey);

    if (!validKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Adjuntar info del key al request
    request.apiKey = validKey;
    request.user = validKey.user;

    return true;
  }
}

