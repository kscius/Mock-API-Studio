// backend/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TwoFactorController } from './controllers/two-factor.controller';
import { OAuthController } from './controllers/oauth.controller';
import { TwoFactorService } from './services/two-factor.service';
import { OAuthService } from './services/oauth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.jwtSecret,
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  providers: [
    AuthService,
    TwoFactorService,
    OAuthService,
    JwtStrategy,
    GithubStrategy,
    GoogleStrategy,
  ],
  controllers: [
    AuthController,
    TwoFactorController,
    OAuthController,
  ],
  exports: [AuthService, TwoFactorService, OAuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}

