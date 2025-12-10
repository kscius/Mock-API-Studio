// backend/src/mock-runtime/mock-runtime.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MockRuntimeController } from './mock-runtime.controller';
import { MockRuntimeService } from './mock-runtime.service';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [forwardRef(() => WebhooksModule)],
  controllers: [MockRuntimeController],
  providers: [MockRuntimeService],
})
export class MockRuntimeModule {}

