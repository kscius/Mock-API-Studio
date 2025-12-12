// backend/src/audit-logs/decorators/audit-log.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { AUDIT_LOG_METADATA, AuditLogMetadata } from '../interceptors/audit-log.interceptor';

export const AuditLog = (metadata: AuditLogMetadata) =>
  SetMetadata(AUDIT_LOG_METADATA, metadata);

