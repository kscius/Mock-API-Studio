// backend/src/openapi/openapi.module.ts
import { Module } from '@nestjs/common';
import { OpenApiParserService } from './openapi-parser.service';

@Module({
  providers: [OpenApiParserService],
  exports: [OpenApiParserService],
})
export class OpenApiModule {}

