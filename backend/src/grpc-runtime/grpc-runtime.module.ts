import { Module } from '@nestjs/common';
import { GrpcRuntimeController } from './grpc-runtime.controller';
import { GrpcAdminController } from './grpc-admin.controller';
import { GrpcRuntimeService } from './grpc-runtime.service';

@Module({
  controllers: [GrpcRuntimeController, GrpcAdminController],
  providers: [GrpcRuntimeService],
  exports: [GrpcRuntimeService],
})
export class GrpcRuntimeModule {}
