// messages.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/auth.guard';

import { Controller, Get, Req, UseGuards, Param } from '@nestjs/common'; // Removed ParseUUIDPipe
// For MongoId, a custom pipe or string validation might be better.
// Let's assume partnerId is a string for now and validated as needed by Mongoose string coersion.

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':partnerId') // Expect partnerId as a route parameter
  async getMessages(
    @Req() req: Request,
    @Param('partnerId') partnerId: string, // Get partnerId from route params
  ) {
    interface JwtPayload {
      sub: string;
    }
    const user = req.user as JwtPayload;
    const userId = user.sub;
    return this.messagesService.getMessages(userId, partnerId);
  }
}
