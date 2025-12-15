import { Module } from '@nestjs/common';
import { ApiDiffService } from './api-diff.service';
import { ApiDiffController } from './api-diff.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ApiDiffController],
  providers: [ApiDiffService],
  exports: [ApiDiffService],
})
export class ApiDiffModule {}

