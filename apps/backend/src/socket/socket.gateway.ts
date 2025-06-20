// socket.gateway.ts

import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { User } from 'src/users/schemas/user.schema/user.schema';
import { MessagesService } from 'src/messages/messages.service';

@WebSocketGateway({
  cors: {
    origin: '*', // يمكنك تحديد رابط ال frontend فقط إن أردت
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('SocketGateway');
  constructor(private readonly messagesService: MessagesService) {}

  handleConnection(client: Socket) {
    this.logger.log(`🔌 User connected: ${client.id}`);
    // يمكنك أيضًا إرسال رسالة للعميل هنا إن أردت
    // client.emit('connected', 'Welcome to socket server!');
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
    const senderId = (client as any).userId; // ← إذا حاطط userId بالدالة middleware

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
}
