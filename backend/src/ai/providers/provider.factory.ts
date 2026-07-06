import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAIProvider } from './base.provider';
import { OpenAiProvider } from './openai.provider';
import { OllamaProvider } from './ollama.provider';
import { AnthropicProvider } from './anthropic.provider';

@Injectable()
export class ProviderFactory {
  constructor(
    private readonly config: ConfigService,
    private readonly openAi: OpenAiProvider,
    private readonly ollama: OllamaProvider,
    private readonly anthropic: AnthropicProvider,
  ) {}

  getProvider(): IAIProvider {
    const provider = this.config.get<string>('AI_PROVIDER', 'openai');
    switch (provider) {
      case 'openai':
        return this.openAi;
      case 'ollama':
        return this.ollama;
      case 'anthropic':
        return this.anthropic;
      default:
        throw new Error(`AI provider '${provider}' is not configured`);
    }
  }
}
