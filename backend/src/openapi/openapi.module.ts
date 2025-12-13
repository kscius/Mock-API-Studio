// backend/src/openapi/openapi.module.ts
import { Module } from '@nestjs/common';
import { OpenApiParserService } from './openapi-parser.service';
import { OpenApiGeneratorService } from './openapi-generator.service';

@Module({
  providers: [OpenApiParserService, OpenApiGeneratorService],
  exports: [OpenApiParserService, OpenApiGeneratorService],
})
export class OpenApiModule {}

