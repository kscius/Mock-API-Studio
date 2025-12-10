import { Controller, Post, Param, Body, Headers, Query } from '@nestjs/common';
import { GraphQLRuntimeService } from './graphql-runtime.service';

@Controller('mock-graphql')
export class GraphQLRuntimeController {
  constructor(private readonly service: GraphQLRuntimeService) {}

  @Post(':apiSlug')
  async handleGraphQL(
    @Param('apiSlug') apiSlug: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Query('workspaceId') workspaceId?: string,
  ) {
    const workspaceIdFromHeader = headers['x-workspace-id'];
    const finalWorkspaceId = workspaceId || workspaceIdFromHeader;

    return this.service.handleGraphQLRequest({
      workspaceId: finalWorkspaceId,
      apiSlug,
      graphqlRequest: {
        query: body.query,
        operationName: body.operationName,
        variables: body.variables,
      },
    });
  }
}

