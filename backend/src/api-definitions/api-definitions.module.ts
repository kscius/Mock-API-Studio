// backend/src/api-definitions/api-definitions.module.ts
import { Module } from '@nestjs/common';
import { ApiDefinitionsController } from './api-definitions.controller';
import { ApiDefinitionsService } from './api-definitions.service';
import { PostmanExportService } from './services/postman-export.service';
import { InsomniaExportService } from './services/insomnia-export.service';
import { OpenApiModule } from '../openapi/openapi.module';

@Module({
  imports: [OpenApiModule],
  controllers: [ApiDefinitionsController],
  providers: [
    ApiDefinitionsService,
    PostmanExportService,
    InsomniaExportService,
  ],
  exports: [ApiDefinitionsService],
})
export class ApiDefinitionsModule {}

