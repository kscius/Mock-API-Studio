import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { SmartMockService } from './smart-mock.service';
import { AutoDocumentationService } from './auto-documentation.service';
import { OpenAiProvider } from './providers/openai.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { ProviderFactory } from './providers/provider.factory';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AiController],
  providers: [
    SmartMockService,
    AutoDocumentationService,
    OpenAiProvider,
    OllamaProvider,
    AnthropicProvider,
    ProviderFactory,
  ],
  exports: [SmartMockService, AutoDocumentationService],
})
export class AiModule {}
