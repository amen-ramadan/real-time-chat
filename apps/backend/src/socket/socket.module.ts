import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { MessagesModule } from 'src/messages/messages.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [MessagesModule, AuthModule],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
