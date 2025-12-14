import { Module } from '@nestjs/common';
import { WebSocketMocksGateway } from './websocket-mocks.gateway';
import { WebSocketMocksController } from './websocket-mocks.controller';

@Module({
  providers: [WebSocketMocksGateway],
  controllers: [WebSocketMocksController],
})
export class WebSocketMocksModule {}

