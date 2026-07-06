import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAIProvider } from './base.provider';
import { OpenAiProvider } from './openai.provider';

@Injectable()
export class ProviderFactory {
  constructor(
    private readonly config: ConfigService,
    private readonly openAi: OpenAiProvider,
  ) {}

  getProvider(): IAIProvider {
    const provider = this.config.get<string>('AI_PROVIDER', 'openai');
    if (provider === 'openai') {
      return this.openAi;
    }
    throw new Error(`AI provider '${provider}' is not configured`);
  }
}
