// backend/src/auth/auth.controller.ts
import { Body, Controller, Get, Post, UseGuards, Request, Delete, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.name);
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Body('twoFactorToken') twoFactorToken?: string) {
    return this.authService.login(dto.email, dto.password, twoFactorToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    return req.user;
  }

  @Post('api-keys')
  @UseGuards(JwtAuthGuard)
  async createApiKey(@Request() req: any, @Body() dto: CreateApiKeyDto) {
    return this.authService.createApiKey(
      req.user.id,
      dto.name,
      dto.scope,
      dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    );
  }

  @Get('api-keys')
  @UseGuards(JwtAuthGuard)
  async listApiKeys(@Request() req: any) {
    return this.authService.listApiKeys(req.user.id);
  }

  @Delete('api-keys/:id')
  @UseGuards(JwtAuthGuard)
  async revokeApiKey(@Request() req: any, @Param('id') id: string) {
    return this.authService.revokeApiKey(id, req.user.id);
  }
}

