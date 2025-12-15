import { Module } from '@nestjs/common';
import { ContractTestingService } from './contract-testing.service';
import { ContractTestingController } from './contract-testing.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ApiDefinitionsModule } from '../api-definitions/api-definitions.module';

@Module({
  imports: [PrismaModule, ApiDefinitionsModule],
  controllers: [ContractTestingController],
  providers: [ContractTestingService],
  exports: [ContractTestingService],
})
export class ContractTestingModule {}

