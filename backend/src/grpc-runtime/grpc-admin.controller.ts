import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GrpcRuntimeService } from './grpc-runtime.service';

@Controller('admin/grpc')
@UseGuards(JwtAuthGuard)
export class GrpcAdminController {
  constructor(private readonly service: GrpcRuntimeService) {}

  @Get('apis/:apiId/methods')
  listMethods(@Param('apiId') apiId: string) {
    return this.service.listMethods(apiId);
  }
}
