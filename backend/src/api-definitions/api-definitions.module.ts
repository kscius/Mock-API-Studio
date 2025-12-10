// backend/src/api-definitions/api-definitions.module.ts
import { Module } from '@nestjs/common';
import { ApiDefinitionsController } from './api-definitions.controller';
import { ApiDefinitionsService } from './api-definitions.service';
import { OpenApiModule } from '../openapi/openapi.module';

@Module({
  imports: [OpenApiModule],
  controllers: [ApiDefinitionsController],
  providers: [ApiDefinitionsService],
  exports: [ApiDefinitionsService],
})
export class ApiDefinitionsModule {}

