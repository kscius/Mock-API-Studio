// backend/src/openapi/openapi.module.ts
import { Module } from '@nestjs/common';
import { OpenApiParserService } from './openapi-parser.service';
import { OpenApiGeneratorService } from './openapi-generator.service';
import { GraphQLSchemaParserService } from './graphql-schema-parser.service';

@Module({
  providers: [OpenApiParserService, OpenApiGeneratorService, GraphQLSchemaParserService],
  exports: [OpenApiParserService, OpenApiGeneratorService, GraphQLSchemaParserService],
})
export class OpenApiModule {}

