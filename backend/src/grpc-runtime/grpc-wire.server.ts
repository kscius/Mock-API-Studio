import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import { ConfigService } from '../config/config.service';
import { GrpcServiceRegistry } from './grpc-service.registry';

@Injectable()
export class GrpcWireServerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GrpcWireServerService.name);
  private server: grpc.Server | null = null;
  private boundPort: number | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly registry: GrpcServiceRegistry,
  ) {}

  async onModuleInit() {
    if (!this.config.grpcEnabled) {
      return;
    }
    await this.start();
  }

  async onModuleDestroy() {
    await this.stop();
  }

  async restart() {
    await this.stop();
    if (!this.config.grpcEnabled) {
      return this.getStatus();
    }
    await this.start();
    return this.getStatus();
  }

  async start() {
    if (!this.config.grpcEnabled) {
      return this.getStatus();
    }

    this.server = new grpc.Server({
      'grpc.max_receive_message_length': this.config.grpcMaxReceiveMessageLength,
      'grpc.max_send_message_length': this.config.grpcMaxSendMessageLength,
    });
    this.registry.attachServer(this.server);
    this.registry.clear();
    await this.registry.reloadAll();

    const credentials = grpc.ServerCredentials.createInsecure();
    await new Promise<void>((resolve, reject) => {
      this.server!.bindAsync(
        `${this.config.grpcHost}:${this.config.grpcPort}`,
        credentials,
        (error, port) => {
          if (error) {
            reject(error);
            return;
          }
          this.boundPort = port;
          resolve();
        },
      );
    });

    this.server.start();
    this.logger.log(
      `gRPC wire server listening on ${this.config.grpcHost}:${this.boundPort ?? this.config.grpcPort}`,
    );
    return this.getStatus();
  }

  async stop() {
    if (!this.server) {
      return;
    }
    await new Promise<void>((resolve) => {
      this.server!.tryShutdown(() => resolve());
    });
    this.server = null;
    this.boundPort = null;
    this.registry.clear();
  }

  getStatus() {
    return {
      enabled: this.config.grpcEnabled,
      bound: this.boundPort !== null,
      host: this.config.grpcHost,
      port: this.config.grpcPort,
      boundPort: this.boundPort,
    };
  }
}
