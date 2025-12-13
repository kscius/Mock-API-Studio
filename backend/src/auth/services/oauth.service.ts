import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

interface OAuthProfile {
  provider: string;
  providerId: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  accessToken: string;
}

@Injectable()
export class OAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async handleOAuthLogin(profile: OAuthProfile): Promise<{ user: User; token: string }> {
    // Try to find user by email
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          username: profile.username,
          password: '', // OAuth users don't have passwords
          isEmailVerified: true, // Trust OAuth providers
          // Store OAuth info in metadata or separate table if needed
        },
      });
    }

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      username: user.username,
    });

    return { user, token };
  }
}

