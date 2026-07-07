import { Module } from '@nestjs/common';
import { GrpcRuntimeController } from './grpc-runtime.controller';
import { GrpcAdminController } from './grpc-admin.controller';
import { GrpcRuntimeService } from './grpc-runtime.service';
import { GrpcProtoService } from './grpc-proto.service';
import { GrpcHandlerFactory } from './grpc-handler.factory';
import { GrpcServiceRegistry } from './grpc-service.registry';
import { GrpcWireServerService } from './grpc-wire.server';

@Module({
  controllers: [GrpcRuntimeController, GrpcAdminController],
  providers: [
    GrpcRuntimeService,
    GrpcProtoService,
    GrpcHandlerFactory,
    GrpcServiceRegistry,
    GrpcWireServerService,
  ],
  exports: [GrpcRuntimeService, GrpcWireServerService],
})
export class GrpcRuntimeModule {}
