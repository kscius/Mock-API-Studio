import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { createHash } from 'node:crypto';
import { mkdir, writeFile, unlink, rm } from 'node:fs/promises';
import * as path from 'node:path';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { extractCatalogs, flattenServices } from './grpc-proto.parser';
import { GrpcProtoCatalog } from './interfaces/grpc-proto-catalog.interface';

export const PROTO_LOADER_OPTIONS: protoLoader.Options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

@Injectable()
export class GrpcProtoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async listBundles(apiId: string) {
    await this.ensureApi(apiId);
    return this.prisma.grpcProtoBundle.findMany({
      where: { apiId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBundle(apiId: string, bundleId: string) {
    const bundle = await this.prisma.grpcProtoBundle.findFirst({
      where: { id: bundleId, apiId },
    });
    if (!bundle) {
      throw new NotFoundException('Proto bundle not found');
    }
    return bundle;
  }

  async importText(
    apiId: string,
    filename: string,
    content: string,
    options?: { autoCreateEndpoints?: boolean; isPrimary?: boolean },
  ) {
    if (!filename.endsWith('.proto')) {
      throw new BadRequestException('filename must end with .proto');
    }
    if (!content.trim()) {
      throw new BadRequestException('content is required');
    }

    await this.ensureApi(apiId);
    const sha256 = createHash('sha256').update(content).digest('hex');
    const apiDir = path.join(this.config.grpcProtoStorageDir, apiId);
    await mkdir(apiDir, { recursive: true });
    const storagePath = path.join(apiDir, path.basename(filename));
    await writeFile(storagePath, content, 'utf8');

    const catalogs = this.loadCatalogs(storagePath, [apiDir]);
    const services = flattenServices(catalogs);
    const packageName = catalogs[0]?.packageName ?? null;

    const bundle = await this.prisma.grpcProtoBundle.upsert({
      where: { apiId_filename: { apiId, filename: path.basename(filename) } },
      create: {
        apiId,
        filename: path.basename(filename),
        storagePath,
        packageName,
        services: services as unknown as object,
        sha256,
        isPrimary: options?.isPrimary ?? true,
      },
      update: {
        storagePath,
        packageName,
        services: services as unknown as object,
        sha256,
        isPrimary: options?.isPrimary ?? true,
      },
    });

    let endpointsCreated = 0;
    if (options?.autoCreateEndpoints) {
      endpointsCreated = await this.autoCreateEndpoints(apiId, catalogs);
    }

    return { bundle, catalogs, endpointsCreated };
  }

  async deleteBundle(apiId: string, bundleId: string) {
    const bundle = await this.getBundle(apiId, bundleId);
    try {
      await unlink(bundle.storagePath);
    } catch {
      // ignore missing file
    }
    await this.prisma.grpcProtoBundle.delete({ where: { id: bundle.id } });
    return { deleted: true };
  }

  loadPackageDefinition(absPath: string, includeDirs: string[]): grpc.GrpcObject {
    const definition = this.loadRawDefinition(absPath, includeDirs);
    return grpc.loadPackageDefinition(definition) as grpc.GrpcObject;
  }

  loadRawDefinition(absPath: string, includeDirs: string[]): protoLoader.PackageDefinition {
    return protoLoader.loadSync(absPath, {
      ...PROTO_LOADER_OPTIONS,
      includeDirs,
    });
  }

  loadCatalogs(absPath: string, includeDirs: string[]): GrpcProtoCatalog[] {
    const definition = this.loadRawDefinition(absPath, includeDirs);
    return extractCatalogs(definition);
  }

  private async autoCreateEndpoints(apiId: string, catalogs: GrpcProtoCatalog[]) {
    let created = 0;
    for (const catalog of catalogs) {
      for (const service of catalog.services) {
        for (const method of service.methods) {
          const existing = await this.prisma.apiEndpoint.findFirst({
            where: { apiId, method: method.name, path: service.fqName },
          });
          if (existing) {
            continue;
          }
          await this.prisma.apiEndpoint.create({
            data: {
              apiId,
              type: 'GRPC',
              path: service.fqName,
              method: method.name,
              operationType: method.serverStreaming ? 'server_streaming' : 'unary',
              summary: `${service.fqName}/${method.name}`,
              responses: [{ isDefault: true, body: {}, status: 0 }],
              enabled: true,
            },
          });
          created += 1;
        }
      }
    }
    return created;
  }

  private async ensureApi(apiId: string) {
    const api = await this.prisma.apiDefinition.findUnique({ where: { id: apiId } });
    if (!api) {
      throw new NotFoundException(`API with ID ${apiId} not found`);
    }
    return api;
  }

  async clearApiProtos(apiId: string) {
    const apiDir = path.join(this.config.grpcProtoStorageDir, apiId);
    try {
      await rm(apiDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}
