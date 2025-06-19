import {
  WebSocketGateway,
  // SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // أو حدد موقع الـ frontend
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger: Logger = new Logger('SocketGateway');

  handleConnection(client: Socket) {
    this.logger.log(`🔌 User connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`❌ User disconnected: ${client.id}`);
  }
}
