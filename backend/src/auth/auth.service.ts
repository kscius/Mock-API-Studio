// backend/src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string, name?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name,
        role: 'user',
      },
    });

    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async login(email: string, password: string, twoFactorToken?: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        // Return a special response indicating 2FA is required
        return {
          requiresTwoFactor: true,
          message: 'Two-factor authentication is required',
        };
      }

      // Verify 2FA token
      const { authenticator } = await import('otplib');
      const isValid = authenticator.verify({
        token: twoFactorToken,
        secret: user.twoFactorSecret!,
      });

      if (!isValid) {
        throw new UnauthorizedException('Invalid two-factor authentication code');
      }
    }

    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async validateUser(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return this.sanitizeUser(user);
  }

  async createApiKey(userId: string, name: string, scope: string[] = ['*'], expiresAt?: Date) {
    // Generar key real (lo devolvemos 1 sola vez)
    const rawKey = `mas_${randomBytes(32).toString('hex')}`;
    const keyHash = await bcrypt.hash(rawKey, 10);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        key: keyHash,
        name,
        userId,
        scope,
        expiresAt,
      },
    });

    return {
      apiKey,
      rawKey, // solo una vez
    };
  }

  async validateApiKey(rawKey: string): Promise<any> {
    // Buscar todas las keys activas (ineficiente, pero simple)
    // En producción: usar lookup table con prefijo
    const keys = await this.prisma.apiKey.findMany({
      where: { isActive: true },
      include: { user: true },
    });

    for (const apiKey of keys) {
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        continue;
      }

      const valid = await bcrypt.compare(rawKey, apiKey.key);
      if (valid) {
        // actualizar lastUsedAt
        await this.prisma.apiKey.update({
          where: { id: apiKey.id },
          data: { lastUsedAt: new Date() },
        });

        return apiKey;
      }
    }

    return null;
  }

  async listApiKeys(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        scope: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  async revokeApiKey(id: string, userId: string) {
    return this.prisma.apiKey.updateMany({
      where: { id, userId },
      data: { isActive: false },
    });
  }

  private generateToken(user: any): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: any) {
    const { password, ...rest } = user;
    return rest;
  }
}

