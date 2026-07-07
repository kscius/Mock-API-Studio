import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import { GrpcRuntimeService } from './grpc-runtime.service';
import { GrpcMockContext } from './interfaces/grpc-proto-catalog.interface';
import { ConfigService } from '../config/config.service';

export function mapExceptionToGrpcStatus(err: unknown): grpc.ServiceError {
  const message = err instanceof Error ? err.message : 'Internal error';
  let code = grpc.status.INTERNAL;
  if (err instanceof NotFoundException) {
    code = grpc.status.NOT_FOUND;
  } else if (err instanceof BadRequestException) {
    code = grpc.status.INVALID_ARGUMENT;
  }
  return Object.assign(new Error(message), {
    code,
    details: message,
    metadata: new grpc.Metadata(),
  }) as grpc.ServiceError;
}

@Injectable()
export class GrpcHandlerFactory {
  constructor(
    private readonly runtime: GrpcRuntimeService,
    private readonly config: ConfigService,
  ) {}

  createHandlers(
    serviceFqn: string,
    methodNames: string[],
  ): grpc.UntypedServiceImplementation {
    const handlers: grpc.UntypedServiceImplementation = {};
    for (const methodName of methodNames) {
      handlers[methodName] = (
        call: grpc.ServerUnaryCall<unknown, unknown> | grpc.ServerWritableStream<unknown, unknown>,
        callback?: grpc.sendUnaryData<unknown>,
      ) => {
        if (callback) {
          void this.handleUnary(call as grpc.ServerUnaryCall<unknown, unknown>, callback, serviceFqn, methodName);
          return;
        }
        void this.handleServerStreaming(
          call as grpc.ServerWritableStream<unknown, unknown>,
          serviceFqn,
          methodName,
        );
      };
    }
    return handlers;
  }

  private extractContext(
    call: grpc.ServerUnaryCall<unknown, unknown> | grpc.ServerWritableStream<unknown, unknown>,
  ): GrpcMockContext {
    const metadata = call.metadata;
    const workspaceId =
      metadata.get('x-workspace-id')?.[0]?.toString() ?? this.config.grpcDefaultWorkspaceId;
    const apiSlug =
      metadata.get('x-mock-api-slug')?.[0]?.toString() ?? this.config.grpcDefaultApiSlug;

    if (!apiSlug) {
      throw new BadRequestException(
        'x-mock-api-slug metadata is required (or set GRPC_DEFAULT_API_SLUG)',
      );
    }

    const metadataRecord: Record<string, string> = {};
    const rawMap = metadata.getMap();
    for (const key of Object.keys(rawMap)) {
      const values = rawMap[key];
      metadataRecord[key] = Array.isArray(values) ? values.join(',') : String(values);
    }

    return {
      workspaceId: workspaceId || undefined,
      apiSlug,
      service: '',
      method: '',
      input: (call.request ?? {}) as Record<string, unknown>,
      metadata: metadataRecord,
    };
  }

  private async handleUnary(
    call: grpc.ServerUnaryCall<unknown, unknown>,
    callback: grpc.sendUnaryData<unknown>,
    serviceFqn: string,
    methodName: string,
  ) {
    try {
      const ctx = this.extractContext(call);
      const result = await this.runtime.invokeFromWire({
        ...ctx,
        service: serviceFqn,
        method: methodName,
      });
      callback(null, result.message);
    } catch (err) {
      callback(mapExceptionToGrpcStatus(err));
    }
  }

  private async handleServerStreaming(
    call: grpc.ServerWritableStream<unknown, unknown>,
    serviceFqn: string,
    methodName: string,
  ) {
    try {
      const ctx = this.extractContext(call);
      const result = await this.runtime.invokeFromWire({
        ...ctx,
        service: serviceFqn,
        method: methodName,
      });
      const messages = Array.isArray(result.message) ? result.message : [result.message];
      for (const message of messages) {
        call.write(message);
      }
      call.end();
    } catch (err) {
      call.destroy(mapExceptionToGrpcStatus(err));
    }
  }
}
