import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { SmartMockService } from './smart-mock.service';
import { OpenAiProvider } from './providers/openai.provider';
import { ProviderFactory } from './providers/provider.factory';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [SmartMockService, OpenAiProvider, ProviderFactory],
  exports: [SmartMockService],
})
export class AiModule {}
