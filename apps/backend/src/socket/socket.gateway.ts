import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { User } from 'src/users/schemas/user.schema/user.schema';
import { MessagesService } from 'src/messages/messages.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*', // يمكنك تحديد رابط ال frontend فقط إن أردت
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('SocketGateway');

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Attempting to handle new socket connection: ${client.id}`);
    try {
      const authToken = client.handshake.auth?.token;
      const handshakeAuthHeader = client.handshake.headers?.authorization;
      const requestAuthHeader = client.request.headers?.authorization; // Less common for Socket.IO

      this.logger.debug(`Client ${client.id} handshake auth: ${JSON.stringify(client.handshake.auth)}`);
      this.logger.debug(`Client ${client.id} handshake headers: ${JSON.stringify(client.handshake.headers)}`);

      let token: string | undefined;

      if (typeof authToken === 'string' && authToken.length > 0) {
        token = authToken;
        this.logger.log(`Token found in handshake.auth for client ${client.id}`);
      } else if (typeof handshakeAuthHeader === 'string' && handshakeAuthHeader.startsWith('Bearer ')) {
        token = handshakeAuthHeader.replace('Bearer ', '');
        this.logger.log(`Token found in handshake.headers.authorization for client ${client.id}`);
      } else if (typeof requestAuthHeader === 'string' && requestAuthHeader.startsWith('Bearer ')) {
        // This is less standard for WebSockets but included for completeness from original code
        token = requestAuthHeader.replace('Bearer ', '');
        this.logger.log(`Token found in client.request.headers.authorization for client ${client.id}`);
      }

      if (!token) {
        this.logger.warn(`Authentication failed for client ${client.id}: Token not provided.`);
        client.emit('error', { message: 'Token not provided' }); // Send error to client
        client.disconnect(true); // Force disconnect
        return;
      }

      let payload: { sub: string };
      try {
        payload = this.jwtService.verify<{ sub: string }>(token);
        this.logger.debug(`Token verified for client ${client.id}, payload sub: ${payload.sub}`);
      } catch (error) {
        this.logger.warn(`Authentication failed for client ${client.id}: Invalid token. Error: ${error.message}`);
        client.emit('error', { message: 'Invalid token' });
        client.disconnect(true);
        return;
      }

      const userId = payload.sub;
      if (!userId) { // Should not happen if verify succeeded and sub is in payload
        this.logger.error(`Authentication failed for client ${client.id}: Invalid payload (userId missing after verify).`);
        client.emit('error', { message: 'Invalid payload' });
        client.disconnect(true);
        return;
      }

      client.data.userId = userId;
      client.join(userId);
      this.logger.log(`🔌 Client ${client.id} connected and authenticated as user ${userId}. Joined room ${userId}.`);

    } catch (error) {
      // This is a catch-all for any unexpected errors during the connection handling
      this.logger.error(`Unexpected error in handleConnection for client ${client.id}: ${error.message}`, error.stack);
      client.emit('error', { message: 'Server error during connection' });
      client.disconnect(true);
    }
  }

  emitUserCreated(user: User) {
    this.logger.log(`📢 New user created: ${user.email}`);
    this.server.emit('user_created', user);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`❌ User disconnected: ${client.id}`);
  }

  // ✅ send_message handler
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody()
    data: {
      receiverId: string;
      content: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data.userId; // ← التصحيح هنا

    // 👇 احفظ الرسالة بالخدمة
    const message = await this.messagesService.createMessage({
      senderId,
      receiverId: data.receiverId,
      content: data.content,
    });

    // 👇 أرسل الرسالة للطرفين
    this.server
      .to([data.receiverId, senderId])
      .emit('receive_message', message);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() receiverId: string,
    @ConnectedSocket() client: Socket,
  ) {
    // من الذي يكتب؟ client.id أو شيء ثاني (مثلاً socket.userId لو عملت Auth)
    this.server.to(receiverId).emit('typing', client.id);
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(
    @MessageBody() receiverId: string,
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(receiverId).emit('stop_typing', client.id);
  }

  @SubscribeMessage('seen')
  async handleSeen(
    @MessageBody() receiverId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data.userId;

    this.logger.log(
      `📩 Marking messages from ${senderId} as seen by ${receiverId}`,
    );

    await this.messagesService.markMessagesAsSeen(senderId, receiverId);

    this.server.emit('seen', senderId);
  }

  emitUserUpdated(user: any) {
    this.server.emit('user_updated', user);
  }
}
