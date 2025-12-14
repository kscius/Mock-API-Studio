import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../common/prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: /^\/ws\/.+$/, // Match any path starting with /ws/
})
export class WebSocketMocksGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketMocksGateway.name);
  private intervals = new Map<string, NodeJS.Timeout>();

  constructor(private prisma: PrismaService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Mock Server initialized');
  }

  async handleConnection(client: Socket) {
    const namespace = client.nsp.name; // e.g., /ws/notifications
    this.logger.log(`Client connected to ${namespace}: ${client.id}`);

    try {
      // Find matching WebSocket endpoint
      const wsEndpoint = await this.findWebSocketEndpoint(namespace);

      if (!wsEndpoint) {
        this.logger.warn(`No WebSocket endpoint configured for ${namespace}`);
        client.emit('error', { message: 'WebSocket endpoint not found' });
        client.disconnect();
        return;
      }

      // Send welcome message
      client.emit('connected', {
        message: 'Connected to Mock API Studio WebSocket',
        path: wsEndpoint.path,
        timestamp: new Date().toISOString(),
      });

      // Start sending events based on configuration
      this.startEventStreaming(client, wsEndpoint);
    } catch (error) {
      this.logger.error(`Error handling connection: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Clear any intervals for this client
    const intervalKey = `${client.id}`;
    const interval = this.intervals.get(intervalKey);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(intervalKey);
    }
  }

  private async findWebSocketEndpoint(path: string): Promise<any | null> {
    try {
      const wsEndpoint = await this.prisma.webSocketEndpoint.findFirst({
        where: { path },
        include: { api: true },
      });

      return wsEndpoint;
    } catch (error) {
      this.logger.error(`Error finding WebSocket endpoint: ${error.message}`);
      return null;
    }
  }

  private startEventStreaming(client: Socket, wsEndpoint: any) {
    const events = wsEndpoint.events as any[];

    if (!events || events.length === 0) {
      return;
    }

    // Send on-connection events
    events
      .filter((e) => e.trigger === 'connection')
      .forEach((event) => {
        client.emit(event.name, event.payload);
      });

    // Set up interval events
    events
      .filter((e) => e.trigger === 'interval' && e.interval)
      .forEach((event) => {
        const intervalKey = `${client.id}-${event.name}`;
        const interval = setInterval(() => {
          client.emit(event.name, event.payload);
        }, event.interval);

        this.intervals.set(intervalKey, interval);
      });
  }
}

