import { Controller, Post, Get, Param, Body, Headers, Query } from '@nestjs/common';
import { GrpcRuntimeService } from './grpc-runtime.service';
import { InvokeGrpcDto } from './dto/invoke-grpc.dto';

@Controller('mock-grpc')
export class GrpcRuntimeController {
  constructor(private readonly service: GrpcRuntimeService) {}

  @Post(':apiSlug')
  async invoke(
    @Param('apiSlug') apiSlug: string,
    @Body() body: InvokeGrpcDto,
    @Headers() headers: Record<string, string>,
    @Query('workspaceId') workspaceId?: string,
  ) {
    const workspaceIdFromHeader = headers['x-workspace-id'];
    const finalWorkspaceId = workspaceId || workspaceIdFromHeader;

    return this.service.invoke({
      workspaceId: finalWorkspaceId,
      apiSlug,
      service: body.service,
      method: body.method,
      input: body.input,
    });
  }

  @Get(':apiSlug/methods')
  async listPublicMethods(
    @Param('apiSlug') apiSlug: string,
    @Query('workspaceId') workspaceId?: string,
    @Headers() headers?: Record<string, string>,
  ) {
    return this.service.listMethodsBySlug(
      apiSlug,
      workspaceId || headers?.['x-workspace-id'],
    );
  }
}
