import type { PackageDefinition } from '@grpc/proto-loader';
import {
  GrpcProtoCatalog,
  GrpcProtoMethodCatalog,
  GrpcProtoServiceCatalog,
} from './interfaces/grpc-proto-catalog.interface';

type MethodShape = {
  originalName?: string;
  path?: string;
  requestType?: { name?: string; type?: { name?: string } };
  responseType?: { name?: string; type?: { name?: string } };
  requestStream?: boolean;
  responseStream?: boolean;
};

function isServiceDefinition(value: unknown): value is Record<string, MethodShape> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).some(
    (method) =>
      method &&
      typeof method === 'object' &&
      ('originalName' in method || 'path' in method),
  );
}

function methodNameFromShape(methodKey: string, method: MethodShape): string {
  return methodKey;
}

function requestTypeName(method: MethodShape): string {
  return method.requestType?.name ?? method.requestType?.type?.name ?? 'unknown';
}

function responseTypeName(method: MethodShape): string {
  return method.responseType?.name ?? method.responseType?.type?.name ?? 'unknown';
}

export function extractCatalogs(definition: PackageDefinition): GrpcProtoCatalog[] {
  const catalogs = new Map<string, GrpcProtoServiceCatalog[]>();

  for (const key of Object.keys(definition)) {
    const value = definition[key];
    if (!isServiceDefinition(value)) {
      continue;
    }

    const parts = key.split('.');
    const shortName = parts[parts.length - 1] ?? key;
    const packageName = parts.slice(0, -1).join('.');

    const methods: GrpcProtoMethodCatalog[] = Object.keys(value)
      .filter((methodKey) => {
        const method = value[methodKey];
        return method && typeof method === 'object' && ('originalName' in method || 'path' in method);
      })
      .map((methodKey) => {
        const method = value[methodKey] as MethodShape;
        return {
          name: methodNameFromShape(methodKey, method),
          requestType: requestTypeName(method),
          responseType: responseTypeName(method),
          clientStreaming: Boolean(method.requestStream),
          serverStreaming: Boolean(method.responseStream),
        };
      });

    const service: GrpcProtoServiceCatalog = {
      fqName: key,
      shortName,
      methods,
    };

    const bucket = catalogs.get(packageName) ?? [];
    bucket.push(service);
    catalogs.set(packageName, bucket);
  }

  return [...catalogs.entries()].map(([packageName, services]) => ({
    packageName,
    services,
  }));
}

export function flattenServices(catalogs: GrpcProtoCatalog[]): GrpcProtoServiceCatalog[] {
  return catalogs.flatMap((catalog) => catalog.services);
}

export function getServiceDefinition(
  definition: PackageDefinition,
  fqName: string,
): Record<string, MethodShape> | undefined {
  const value = definition[fqName];
  return isServiceDefinition(value) ? value : undefined;
}
