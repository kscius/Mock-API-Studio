import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContractTestingService } from './contract-testing.service';
import { ContractTestingController } from './contract-testing.controller';
import { PactBrokerService } from './pact-broker.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ApiDefinitionsModule } from '../api-definitions/api-definitions.module';

@Module({
  imports: [ConfigModule, PrismaModule, ApiDefinitionsModule],
  controllers: [ContractTestingController],
  providers: [ContractTestingService, PactBrokerService],
  exports: [ContractTestingService, PactBrokerService],
})
export class ContractTestingModule {}

