import { Module } from '@nestjs/common';
import { MockRecordingService } from './mock-recording.service';
import { MockRecordingController } from './mock-recording.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ApiDefinitionsModule } from '../api-definitions/api-definitions.module';

@Module({
  imports: [PrismaModule, ApiDefinitionsModule],
  controllers: [MockRecordingController],
  providers: [MockRecordingService],
  exports: [MockRecordingService],
})
export class MockRecordingModule {}

