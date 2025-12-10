// backend/src/mock-runtime/mock-runtime.controller.ts
import {
  All,
  Body,
  Controller,
  Headers,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { MockRuntimeService } from './mock-runtime.service';

@Controller('mock')
export class MockRuntimeController {
  constructor(private readonly service: MockRuntimeService) {}

  @All(':apiSlug/*')
  async handle(
    @Param('apiSlug') apiSlug: string,
    @Req() req: Request,
    @Body() body: any,
    @Query() query: any,
    @Headers() headers: Record<string, string>,
  ) {
    const path = '/' + (req.params[0] || ''); // parte después de :apiSlug/
    const workspaceId = headers['x-workspace-id'] || query.workspaceId;
    
    return this.service.handleRequest({
      workspaceId,
      apiSlug,
      method: req.method,
      path,
      body,
      query,
      headers,
    });
  }
}

