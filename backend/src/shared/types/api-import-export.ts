// backend/src/shared/types/api-import-export.ts

export type ImportExportResponseMatchRule = {
  query?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  bodyEquals?: any;
};

export type ImportExportMockResponse = {
  status: number;
  headers?: Record<string, string>;
  body: any;
  isDefault?: boolean;
  match?: ImportExportResponseMatchRule;
};

export type ImportExportEndpoint = {
  method: string;
  path: string;
  summary?: string;
  requestSchema?: any;
  responses: ImportExportMockResponse[];
  delayMs?: number;
  enabled?: boolean;
};

export type ImportExportApiMeta = {
  name: string;
  slug: string;
  version?: string;
  basePath?: string;
  description?: string;
  isActive?: boolean;
  tags?: string[];
};

export type ImportExportApiFile = {
  type: 'mock-api-definition';
  schemaVersion: string;
  api: ImportExportApiMeta;
  endpoints: ImportExportEndpoint[];
};

