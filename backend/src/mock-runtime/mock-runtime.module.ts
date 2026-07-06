// backend/src/mock-runtime/mock-runtime.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MockRuntimeController } from './mock-runtime.controller';
import { MockRuntimeService } from './mock-runtime.service';
import { ProxyService } from './services/proxy.service';
import { DeduplicationService } from './services/deduplication.service';
import { MockStateService } from './services/mock-state.service';
import { ChaosService } from './services/chaos.service';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { FakerTemplatingService } from '../shared/faker-templating.service';

@Module({
  imports: [forwardRef(() => WebhooksModule)],
  controllers: [MockRuntimeController],
  providers: [
    MockRuntimeService,
    ProxyService,
    DeduplicationService,
    MockStateService,
    ChaosService,
    FakerTemplatingService,
  ],
  exports: [MockStateService, ChaosService],
})
export class MockRuntimeModule {}

