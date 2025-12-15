import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MockRecordingService } from './mock-recording.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StartRecordingDto, RecordRequestDto } from './dto';

@Controller('admin/mock-recording')
@UseGuards(JwtAuthGuard)
export class MockRecordingController {
  constructor(private readonly mockRecordingService: MockRecordingService) {}

  /**
   * Start a new recording session
   */
  @Post('start')
  async startRecording(@Body() dto: StartRecordingDto) {
    const session = await this.mockRecordingService.startRecording(
      dto.apiId,
      dto.targetUrl,
    );

    return {
      sessionId: session.id,
      apiId: session.apiId,
      targetUrl: session.targetUrl,
      isActive: session.isActive,
      recordedCount: session.recordedRequests.length,
      createdAt: session.createdAt,
    };
  }

  /**
   * Stop a recording session
   */
  @Post(':sessionId/stop')
  async stopRecording(@Param('sessionId') sessionId: string) {
    const session = await this.mockRecordingService.stopRecording(sessionId);

    return {
      sessionId: session.id,
      apiId: session.apiId,
      isActive: session.isActive,
      recordedCount: session.recordedRequests.length,
      message: 'Recording stopped successfully',
    };
  }

  /**
   * Get recording session details
   */
  @Get(':sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    const session = this.mockRecordingService.getSession(sessionId);

    if (!session) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Recording session ${sessionId} not found`,
      };
    }

    return {
      sessionId: session.id,
      apiId: session.apiId,
      targetUrl: session.targetUrl,
      isActive: session.isActive,
      recordedCount: session.recordedRequests.length,
      requests: session.recordedRequests.map((req) => ({
        method: req.method,
        path: req.path,
        status: req.response.status,
        timestamp: req.timestamp,
      })),
      createdAt: session.createdAt,
    };
  }

  /**
   * List all recording sessions for an API
   */
  @Get('api/:apiId/sessions')
  async listSessions(@Param('apiId') apiId: string) {
    const sessions = this.mockRecordingService.listSessions(apiId);

    return {
      apiId,
      sessions: sessions.map((s) => ({
        sessionId: s.id,
        targetUrl: s.targetUrl,
        isActive: s.isActive,
        recordedCount: s.recordedRequests.length,
        createdAt: s.createdAt,
      })),
    };
  }

  /**
   * Proxy and record a request during an active session
   */
  @Post(':sessionId/record')
  async recordRequest(
    @Param('sessionId') sessionId: string,
    @Body() dto: RecordRequestDto,
  ) {
    const response = await this.mockRecordingService.recordRequest(
      sessionId,
      dto.method,
      dto.path,
      dto.headers || {},
      dto.query || {},
      dto.body,
    );

    return {
      status: response.status,
      headers: response.headers,
      body: response.data,
      recorded: true,
    };
  }

  /**
   * Generate mock endpoints from recorded requests
   */
  @Post(':sessionId/generate')
  async generateMocks(@Param('sessionId') sessionId: string) {
    const result = await this.mockRecordingService.generateMocks(sessionId);

    return {
      sessionId,
      created: result.created,
      skipped: result.skipped,
      total: result.created + result.skipped,
      endpoints: result.endpoints.map((e) => ({
        id: e.id,
        method: e.method,
        path: e.path,
        summary: e.summary,
      })),
      message: `Generated ${result.created} mock endpoint(s) from recording`,
    };
  }

  /**
   * Clear/delete a recording session
   */
  @Delete(':sessionId')
  async clearSession(@Param('sessionId') sessionId: string) {
    await this.mockRecordingService.clearSession(sessionId);

    return {
      sessionId,
      message: 'Recording session cleared successfully',
    };
  }

  /**
   * Proxy endpoint for live recording (catch-all route)
   * This allows using the recording session as a transparent proxy
   */
  @Post(':sessionId/proxy/*')
  @Get(':sessionId/proxy/*')
  async proxyRequest(
    @Param('sessionId') sessionId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const path = req.params[0] ? `/${req.params[0]}` : '/';

    try {
      const response = await this.mockRecordingService.recordRequest(
        sessionId,
        req.method,
        path,
        req.headers as any,
        req.query as any,
        req.body,
      );

      // Forward response
      res.status(response.status);
      
      // Set response headers
      Object.entries(response.headers).forEach(([key, value]) => {
        res.setHeader(key, value as string);
      });

      res.send(response.data);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Recording proxy failed',
        message: error.message,
      });
    }
  }
}

