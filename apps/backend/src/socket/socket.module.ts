import { Module, forwardRef } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { MessagesModule } from '../messages/messages.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [forwardRef(() => MessagesModule), AuthModule],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
