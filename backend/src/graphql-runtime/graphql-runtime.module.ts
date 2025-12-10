import { Module } from '@nestjs/common';
import { GraphQLRuntimeController } from './graphql-runtime.controller';
import { GraphQLRuntimeService } from './graphql-runtime.service';

@Module({
  controllers: [GraphQLRuntimeController],
  providers: [GraphQLRuntimeService],
})
export class GraphQLRuntimeModule {}

