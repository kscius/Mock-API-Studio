import { Injectable, Logger } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import * as path from 'node:path';
import { PrismaService } from '../common/prisma/prisma.service';
import { GrpcProtoService } from './grpc-proto.service';
import { GrpcHandlerFactory } from './grpc-handler.factory';
import { getServiceDefinition } from './grpc-proto.parser';
import { GrpcProtoServiceCatalog } from './interfaces/grpc-proto-catalog.interface';

@Injectable()
export class GrpcServiceRegistry {
  private readonly logger = new Logger(GrpcServiceRegistry.name);
  private server: grpc.Server | null = null;
  private registeredKeys = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly protoService: GrpcProtoService,
    private readonly handlerFactory: GrpcHandlerFactory,
  ) {}

  attachServer(server: grpc.Server) {
    this.server = server;
  }

  clear() {
    this.registeredKeys.clear();
  }

  getRegisteredServiceNames(): string[] {
    return [...this.registeredKeys];
  }

  async reloadAll() {
    if (!this.server) {
      return { registeredServices: [] as string[] };
    }

    const apis = await this.prisma.apiDefinition.findMany({
      where: { isActive: true, isLatest: true, grpcWireEnabled: true },
      include: { grpcProtoBundles: true },
    });

    const registeredServices: string[] = [];

    for (const api of apis) {
      const primary =
        api.grpcProtoBundles.find((bundle) => bundle.isPrimary) ??
        api.grpcProtoBundles[0];
      if (!primary) {
        continue;
      }

      const includeDirs = [path.dirname(primary.storagePath)];
      const definition = this.protoService.loadRawDefinition(
        primary.storagePath,
        includeDirs,
      );
      const services = primary.services as unknown as GrpcProtoServiceCatalog[];

      for (const service of services) {
        const serviceDef = getServiceDefinition(definition, service.fqName);
        if (!serviceDef) {
          this.logger.warn(`Service definition not found for ${service.fqName}`);
          continue;
        }

        const key = `${api.slug}:${service.fqName}`;
        if (this.registeredKeys.has(key)) {
          continue;
        }

        const methodNames = service.methods.map((method) => method.name);
        const handlers = this.handlerFactory.createHandlers(service.fqName, methodNames);
        this.server.addService(serviceDef as grpc.ServiceDefinition, handlers);
        this.registeredKeys.add(key);
        registeredServices.push(service.fqName);
      }
    }

    return { registeredServices };
  }
}
