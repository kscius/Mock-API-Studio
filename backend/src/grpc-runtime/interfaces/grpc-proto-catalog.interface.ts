export interface GrpcProtoMethodCatalog {
  name: string;
  requestType: string;
  responseType: string;
  clientStreaming: boolean;
  serverStreaming: boolean;
}

export interface GrpcProtoServiceCatalog {
  fqName: string;
  shortName: string;
  methods: GrpcProtoMethodCatalog[];
}

export interface GrpcProtoCatalog {
  packageName: string;
  services: GrpcProtoServiceCatalog[];
}

export interface GrpcMockContext {
  workspaceId?: string;
  apiSlug: string;
  service: string;
  method: string;
  input?: Record<string, unknown>;
  metadata?: Record<string, string>;
}
