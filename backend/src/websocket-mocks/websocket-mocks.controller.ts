import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('websocket-endpoints')
@UseGuards(JwtAuthGuard)
export class WebSocketMocksController {
  constructor(private prisma: PrismaService) {}

  @Get('api/:apiId')
  async getWebSocketEndpoints(@Param('apiId') apiId: string) {
    const endpoints = await this.prisma.webSocketEndpoint.findMany({
      where: { apiId },
      orderBy: { createdAt: 'desc' },
    });

    return endpoints;
  }

  @Post('api/:apiId')
  async createWebSocketEndpoint(
    @Param('apiId') apiId: string,
    @Body() data: { path: string; events: any[] },
  ) {
    const endpoint = await this.prisma.webSocketEndpoint.create({
      data: {
        apiId,
        path: data.path,
        events: data.events,
      },
    });

    return endpoint;
  }

  @Delete(':id')
  async deleteWebSocketEndpoint(@Param('id') id: string) {
    await this.prisma.webSocketEndpoint.delete({
      where: { id },
    });

    return { message: 'WebSocket endpoint deleted successfully' };
  }
}

