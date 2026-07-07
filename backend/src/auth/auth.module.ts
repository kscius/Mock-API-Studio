// backend/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TwoFactorController } from './controllers/two-factor.controller';
import { OAuthController } from './controllers/oauth.controller';
import { SamlController } from './controllers/saml.controller';
import { TwoFactorService } from './services/two-factor.service';
import { OAuthService } from './services/oauth.service';
import { SamlService } from './services/saml.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';

const oauthStrategies = [
  ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? [GithubStrategy]
    : []),
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [GoogleStrategy]
    : []),
];

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
    SamlService,
    JwtStrategy,
    ...oauthStrategies,
  ],
  controllers: [
    AuthController,
    TwoFactorController,
    OAuthController,
    SamlController,
  ],
  exports: [AuthService, TwoFactorService, OAuthService, SamlService, JwtStrategy, PassportModule],
})
export class AuthModule {}

