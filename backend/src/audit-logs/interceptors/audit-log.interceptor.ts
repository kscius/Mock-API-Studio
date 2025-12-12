// backend/src/audit-logs/interceptors/audit-log.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogsService } from '../audit-logs.service';
import { Reflector } from '@nestjs/core';

export const AUDIT_LOG_METADATA = 'audit_log';

export interface AuditLogMetadata {
  action: 'create' | 'update' | 'delete';
  entityType: 'api' | 'endpoint' | 'workspace' | 'webhook' | 'user';
  getEntityId?: (result: any, req: any) => string;
  getEntityName?: (result: any, req: any) => string;
  getWorkspaceId?: (result: any, req: any) => string;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const metadata = this.reflector.get<AuditLogMetadata>(
      AUDIT_LOG_METADATA,
      context.getHandler(),
    );

    if (!metadata) {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user; // from JWT guard

    return next.handle().pipe(
      tap((result) => {
        // Create audit log asynchronously (don't block response)
        setImmediate(() => {
          try {
            const entityId = metadata.getEntityId
              ? metadata.getEntityId(result, req)
              : result?.id || req.params?.id;

            const entityName = metadata.getEntityName
              ? metadata.getEntityName(result, req)
              : result?.name || result?.slug;

            const workspaceId = metadata.getWorkspaceId
              ? metadata.getWorkspaceId(result, req)
              : result?.workspaceId || req.body?.workspaceId || req.query?.workspaceId;

            if (!entityId || !workspaceId) {
              return; // Can't log without required fields
            }

            this.auditLogsService.create({
              workspaceId,
              userId: user?.id,
              action: metadata.action,
              entityType: metadata.entityType,
              entityId,
              entityName,
              changes: this.buildChanges(metadata.action, req.body, result),
              ipAddress: req.ip || req.connection?.remoteAddress,
              userAgent: req.headers?.['user-agent'],
            });
          } catch (error) {
            // Silently fail - audit logging should not break the main flow
            console.error('Failed to create audit log:', error);
          }
        });
      }),
    );
  }

  private buildChanges(action: string, requestBody: any, result: any) {
    if (action === 'create') {
      return { after: result };
    }

    if (action === 'update') {
      return {
        before: requestBody._original || null, // You'd need to fetch this
        after: result,
      };
    }

    if (action === 'delete') {
      return { before: result };
    }

    return null;
  }
}

