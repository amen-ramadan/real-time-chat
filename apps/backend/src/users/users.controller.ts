import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.register(createUserDto);
  }

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    return this.usersService.login(loginDto.email, loginDto.password);
  }
  @UseGuards(JwtAuthGuard)
  @Get('secret')
  getSecret(@Req() req: Request & { user?: object }) {
    return {
      message: 'Authenticated',
      user: req.user, // هذا ما أرجعه من jwt.strategy.ts
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/')
  async getUsers(@Req() req: Request) {
    const user = req.user as { sub: string };
    const userId = user.sub; // نأخذ الـ userId من التوكن
    return this.usersService.getUsers(userId);
  }
}
