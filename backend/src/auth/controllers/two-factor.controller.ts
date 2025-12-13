import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { TwoFactorService } from '../services/two-factor.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('auth/2fa')
@UseGuards(JwtAuthGuard)
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  /**
   * Generate 2FA secret and QR code for setup
   */
  @Post('setup')
  async setup(@Request() req: any) {
    const user = req.user;

    // Check if 2FA is already enabled
    const isEnabled = await this.twoFactorService.isTwoFactorEnabled(user.id);
    if (isEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    // Generate secret and QR code
    const { secret, otpauthUrl } = this.twoFactorService.generateSecret(user.email);
    const qrCodeUrl = await this.twoFactorService.generateQRCode(otpauthUrl);

    return {
      secret,
      qrCodeUrl,
      message: 'Scan the QR code with your authenticator app and verify with a token to enable 2FA',
    };
  }

  /**
   * Verify token and enable 2FA
   */
  @Post('enable')
  async enable(@Request() req: any, @Body('token') token: string, @Body('secret') secret: string) {
    if (!token || !secret) {
      throw new BadRequestException('Token and secret are required');
    }

    const user = req.user;

    // Verify the token
    const isValid = this.twoFactorService.verifyToken(secret, token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid token');
    }

    // Enable 2FA
    await this.twoFactorService.enableTwoFactor(user.id, secret);

    return {
      message: 'Two-factor authentication enabled successfully',
    };
  }

  /**
   * Disable 2FA (requires current token verification)
   */
  @Delete('disable')
  async disable(@Request() req: any, @Body('token') token: string) {
    const user = req.user;

    // Get user's 2FA secret
    const secret = await this.twoFactorService.getTwoFactorSecret(user.id);
    if (!secret) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    // Verify the token
    const isValid = this.twoFactorService.verifyToken(secret, token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid token');
    }

    // Disable 2FA
    await this.twoFactorService.disableTwoFactor(user.id);

    return {
      message: 'Two-factor authentication disabled successfully',
    };
  }

  /**
   * Check 2FA status
   */
  @Get('status')
  async status(@Request() req: any) {
    const user = req.user;
    const isEnabled = await this.twoFactorService.isTwoFactorEnabled(user.id);

    return {
      enabled: isEnabled,
    };
  }
}

