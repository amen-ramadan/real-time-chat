import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/common/multer.config';

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

  @UseGuards(JwtAuthGuard)
  @Put('update')
  async updateUser(
    @Req() req: Request,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      status?: string;
    },
  ) {
    const user = req.user as { sub: string };
    const userId = user.sub;

    return this.usersService.updateUser(userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-profile-picture')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async updateProfilePicture(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const user = req.user as { sub: string };
    return this.usersService.updateProfilePicture(user.sub, file);
  }
}
