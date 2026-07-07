import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GrpcRuntimeService } from './grpc-runtime.service';
import { GrpcProtoService } from './grpc-proto.service';
import { GrpcWireServerService } from './grpc-wire.server';
import { GrpcServiceRegistry } from './grpc-service.registry';

@Controller('admin/grpc')
@UseGuards(JwtAuthGuard)
export class GrpcAdminController {
  constructor(
    private readonly service: GrpcRuntimeService,
    private readonly protoService: GrpcProtoService,
    private readonly wireServer: GrpcWireServerService,
    private readonly registry: GrpcServiceRegistry,
  ) {}

  @Get('apis/:apiId/methods')
  listMethods(@Param('apiId') apiId: string) {
    return this.service.listMethods(apiId);
  }

  @Get('apis/:apiId/proto')
  listProtoBundles(@Param('apiId') apiId: string) {
    return this.protoService.listBundles(apiId);
  }

  @Get('apis/:apiId/proto/:bundleId')
  getProtoBundle(@Param('apiId') apiId: string, @Param('bundleId') bundleId: string) {
    return this.protoService.getBundle(apiId, bundleId);
  }

  @Post('apis/:apiId/proto/import')
  async importProtoText(
    @Param('apiId') apiId: string,
    @Body()
    body: { filename: string; content: string; autoCreateEndpoints?: boolean },
  ) {
    const result = await this.protoService.importText(apiId, body.filename, body.content, {
      autoCreateEndpoints: body.autoCreateEndpoints,
    });
    const server = await this.wireServer.restart();
    return { ...result, server };
  }

  @Post('apis/:apiId/proto/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProto(
    @Param('apiId') apiId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('autoCreateEndpoints') autoCreateEndpoints?: string,
  ) {
    const result = await this.protoService.importText(apiId, file.originalname, file.buffer.toString('utf8'), {
      autoCreateEndpoints: autoCreateEndpoints === 'true',
    });
    const server = await this.wireServer.restart();
    return { ...result, server };
  }

  @Delete('apis/:apiId/proto/:bundleId')
  async deleteProtoBundle(@Param('apiId') apiId: string, @Param('bundleId') bundleId: string) {
    const result = await this.protoService.deleteBundle(apiId, bundleId);
    await this.wireServer.restart();
    return result;
  }

  @Post('apis/:apiId/wire/enable')
  async setWireEnabled(
    @Param('apiId') apiId: string,
    @Body() body: { enabled: boolean },
  ) {
    const result = await this.service.setWireEnabled(apiId, body.enabled);
    const server = await this.wireServer.restart();
    return { ...result, server, registeredServices: this.registry.getRegisteredServiceNames() };
  }

  @Get('server/status')
  serverStatus() {
    return {
      ...this.wireServer.getStatus(),
      registeredServices: this.registry.getRegisteredServiceNames(),
    };
  }

  @Post('server/reload')
  async reloadServer() {
    const server = await this.wireServer.restart();
    return {
      ...server,
      registeredServices: this.registry.getRegisteredServiceNames(),
    };
  }
}
