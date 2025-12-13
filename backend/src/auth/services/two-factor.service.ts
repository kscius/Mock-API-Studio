import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TwoFactorService {
  constructor(private prisma: PrismaService) {
    // Configure TOTP options
    authenticator.options = {
      window: 1, // Allow 1 step before and after current time
      step: 30, // 30 seconds per step
    };
  }

  /**
   * Generate a new 2FA secret for a user
   */
  generateSecret(userEmail: string): { secret: string; otpauthUrl: string } {
    const secret = authenticator.generateSecret();
    const appName = process.env.APP_NAME || 'Mock API Studio';
    const otpauthUrl = authenticator.keyuri(userEmail, appName, secret);

    return { secret, otpauthUrl };
  }

  /**
   * Generate QR code as data URL
   */
  async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      return await QRCode.toDataURL(otpauthUrl);
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify a TOTP token
   */
  verifyToken(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      return false;
    }
  }

  /**
   * Enable 2FA for a user
   */
  async enableTwoFactor(userId: string, secret: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: true,
      },
    });
  }

  /**
   * Disable 2FA for a user
   */
  async disableTwoFactor(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: null,
        twoFactorEnabled: false,
      },
    });
  }

  /**
   * Check if user has 2FA enabled
   */
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });
    return user?.twoFactorEnabled ?? false;
  }

  /**
   * Get user's 2FA secret (for verification)
   */
  async getTwoFactorSecret(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true },
    });
    return user?.twoFactorSecret ?? null;
  }
}

