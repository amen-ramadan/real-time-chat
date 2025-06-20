// messages.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/auth.guard';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMessages(@Req() req: Request) {
    interface JwtPayload {
      sub: string;
      // add other properties if needed
    }
    const user = req.user as JwtPayload;
    const userId = user.sub; // مثل req.userId
    return this.messagesService.getMessages(userId);
  }
}
