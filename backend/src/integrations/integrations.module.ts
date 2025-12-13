import { Module } from '@nestjs/common';
import { SlackService } from './services/slack.service';
import { SlackIntegrationsController } from './controllers/slack-integrations.controller';

@Module({
  providers: [SlackService],
  controllers: [SlackIntegrationsController],
  exports: [SlackService],
})
export class IntegrationsModule {}

