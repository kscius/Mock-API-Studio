import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ApiDefinitionsService } from '../api-definitions/api-definitions.service';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { createHash } from 'crypto';

interface RecordingSession {
  id: string;
  apiId: string;
  targetUrl: string;
  isActive: boolean;
  recordedRequests: RecordedRequest[];
  createdAt: Date;
}

interface RecordedRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, any>;
  body: any;
  response: {
    status: number;
    headers: Record<string, string>;
    body: any;
  };
  timestamp: Date;
}

@Injectable()
export class MockRecordingService {
  private readonly logger = new Logger(MockRecordingService.name);
  private readonly sessions = new Map<string, RecordingSession>();

  constructor(
    private prisma: PrismaService,
    private apiDefinitionsService: ApiDefinitionsService,
  ) {}

  /**
   * Start a recording session for an API
   */
  async startRecording(
    apiId: string,
    targetUrl: string,
  ): Promise<RecordingSession> {
    // Verify API exists
    const api = await this.prisma.apiDefinition.findUnique({
      where: { id: apiId },
    });

    if (!api) {
      throw new NotFoundException(`API with ID ${apiId} not found`);
    }

    const sessionId = this.generateSessionId();
    const session: RecordingSession = {
      id: sessionId,
      apiId,
      targetUrl: this.normalizeUrl(targetUrl),
      isActive: true,
      recordedRequests: [],
      createdAt: new Date(),
    };

    this.sessions.set(sessionId, session);

    this.logger.log(
      `Recording session ${sessionId} started for API ${apiId} targeting ${targetUrl}`,
    );

    return session;
  }

  /**
   * Stop a recording session
   */
  async stopRecording(sessionId: string): Promise<RecordingSession> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new NotFoundException(`Recording session ${sessionId} not found`);
    }

    session.isActive = false;

    this.logger.log(
      `Recording session ${sessionId} stopped with ${session.recordedRequests.length} requests`,
    );

    return session;
  }

  /**
   * Get a recording session
   */
  getSession(sessionId: string): RecordingSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * List all recording sessions for an API
   */
  listSessions(apiId: string): RecordingSession[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.apiId === apiId,
    );
  }

  /**
   * Proxy and record a request
   */
  async recordRequest(
    sessionId: string,
    method: string,
    path: string,
    headers: Record<string, string>,
    query: Record<string, any>,
    body: any,
  ): Promise<AxiosResponse> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new NotFoundException(`Recording session ${sessionId} not found`);
    }

    if (!session.isActive) {
      throw new Error(`Recording session ${sessionId} is not active`);
    }

    // Forward request to target URL
    const targetUrl = `${session.targetUrl}${path}`;
    const config: AxiosRequestConfig = {
      method: method as any,
      url: targetUrl,
      headers: this.sanitizeHeaders(headers),
      params: query,
      data: body,
      validateStatus: () => true, // Accept all status codes
      timeout: 30000,
    };

    try {
      const response = await axios(config);

      // Record the request/response pair
      const recordedRequest: RecordedRequest = {
        method,
        path,
        headers: this.sanitizeHeaders(headers),
        query,
        body,
        response: {
          status: response.status,
          headers: this.sanitizeHeaders(response.headers as any),
          body: response.data,
        },
        timestamp: new Date(),
      };

      session.recordedRequests.push(recordedRequest);

      this.logger.debug(
        `Recorded: ${method} ${path} -> ${response.status} (session: ${sessionId})`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error recording request: ${method} ${path}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate mock endpoints from recorded requests
   */
  async generateMocks(sessionId: string): Promise<{
    created: number;
    skipped: number;
    endpoints: any[];
  }> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new NotFoundException(`Recording session ${sessionId} not found`);
    }

    // Group requests by path and method
    const endpointMap = new Map<string, RecordedRequest[]>();

    for (const req of session.recordedRequests) {
      const key = `${req.method}:${req.path}`;
      if (!endpointMap.has(key)) {
        endpointMap.set(key, []);
      }
      endpointMap.get(key)!.push(req);
    }

    const createdEndpoints: any[] = [];
    let created = 0;
    let skipped = 0;

    // Create endpoints for each unique path/method combination
    for (const [key, requests] of endpointMap.entries()) {
      const [method, path] = key.split(':');

      // Check if endpoint already exists
      const existing = await this.prisma.apiEndpoint.findFirst({
        where: {
          apiId: session.apiId,
          method,
          path,
        },
      });

      if (existing) {
        this.logger.debug(`Skipping existing endpoint: ${method} ${path}`);
        skipped++;
        continue;
      }

      // Generate responses from recorded requests
      const responses = requests.map((req, index) => ({
        status: req.response.status,
        headers: req.response.headers,
        body: req.response.body,
        isDefault: index === 0, // First response is default
      }));

      // Create endpoint
      const endpoint = await this.prisma.apiEndpoint.create({
        data: {
          apiId: session.apiId,
          method,
          path,
          summary: `Auto-generated from recording (${requests.length} samples)`,
          responses: responses as any,
          enabled: true,
          type: 'REST',
        },
      });

      createdEndpoints.push(endpoint);
      created++;

      this.logger.log(
        `Created endpoint: ${method} ${path} with ${responses.length} response(s)`,
      );
    }

    // Delete session after generating mocks
    this.sessions.delete(sessionId);

    return {
      created,
      skipped,
      endpoints: createdEndpoints,
    };
  }

  /**
   * Clear a recording session
   */
  async clearSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new NotFoundException(`Recording session ${sessionId} not found`);
    }

    this.sessions.delete(sessionId);
    this.logger.log(`Recording session ${sessionId} cleared`);
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return createHash('sha256')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Normalize target URL (remove trailing slash)
   */
  private normalizeUrl(url: string): string {
    return url.replace(/\/$/, '');
  }

  /**
   * Sanitize headers (remove sensitive headers)
   */
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'set-cookie',
      'x-api-key',
      'x-auth-token',
    ];

    for (const header of sensitiveHeaders) {
      delete sanitized[header.toLowerCase()];
    }

    return sanitized;
  }
}

