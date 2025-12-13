import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL') || 'http://localhost:3000/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const { username, emails, photos, displayName } = profile;
    const email = emails && emails.length > 0 ? emails[0].value : null;
    const avatar = photos && photos.length > 0 ? photos[0].value : null;

    const user = {
      provider: 'github',
      providerId: profile.id,
      email,
      username: username || displayName,
      displayName,
      avatar,
      accessToken,
    };

    done(null, user);
  }
}

