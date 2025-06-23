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
    const token = (client.handshake.auth as { token?: string }).token;
    if (!token) throw new UnauthorizedException('Token not provided');

    let payload: { sub: string };
    try {
      payload = this.jwtService.verify<{ sub: string }>(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }

    const userId = payload.sub;
    if (!userId) throw new UnauthorizedException('Invalid payload');

    // نربط الـ userId مع الاتصال
    client.data.userId = userId; // ← تبسيط الكود
    client.join(userId);

    this.logger.log(`🔌 User connected: ${userId}`);
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
