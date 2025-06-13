import { Controller, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('authenticate')
  authenticate(@Body() body: { username: string }): {
    username: string;
    secret: string;
  } {
    const { username } = body;
    return {
      username,
      secret: 'sha256...',
    };
  }
}
