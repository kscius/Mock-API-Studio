import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { OAuthService } from '../services/oauth.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class OAuthController {
  constructor(
    private oauthService: OAuthService,
    private configService: ConfigService,
  ) {}

  // ========== GITHUB ==========

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    // Passport will redirect to GitHub
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: any, @Res() res: Response) {
    try {
      const { user, token } = await this.oauthService.handleOAuthLogin(req.user);
      
      // Redirect to frontend with token
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&provider=github`);
    } catch (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(error.message)}`);
    }
  }

  // ========== GOOGLE ==========

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
    // Passport will redirect to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    try {
      const { user, token } = await this.oauthService.handleOAuthLogin(req.user);
      
      // Redirect to frontend with token
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&provider=google`);
    } catch (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(error.message)}`);
    }
  }
}

