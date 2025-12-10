// backend/src/analytics/interceptors/tracking.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AnalyticsService } from '../analytics.service';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class TrackingInterceptor implements NestInterceptor {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly config: ConfigService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Solo trackear si analytics está habilitado
    if (!this.config.analyticsEnabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Solo trackear rutas /mock/*
    if (!request.path || !request.path.startsWith('/mock/')) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        this.logRequest(request, response, duration, null, data);
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logRequest(request, response, duration, error);
        throw error;
      }),
    );
  }

  private logRequest(
    request: any,
    response: any,
    duration: number,
    error?: any,
    data?: any,
  ) {
    try {
      // Extraer apiSlug del path /mock/:apiSlug/*
      const pathParts = request.path.split('/');
      const apiSlug = pathParts[2]; // /mock/:apiSlug/...

      if (!apiSlug) return;

      const statusCode = error
        ? error.status || 500
        : data?.statusCode || response.statusCode || 200;

      this.analytics.logRequest({
        apiSlug,
        method: request.method,
        path: request.path,
        statusCode,
        durationMs: duration,
        userAgent: request.headers['user-agent'],
        ip: request.ip || request.connection.remoteAddress,
        error: error ? error.message : undefined,
      });
    } catch (e) {
      // Fallar silenciosamente para no afectar el request
      console.error('Failed to log analytics:', e);
    }
  }
}

