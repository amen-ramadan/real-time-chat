import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'YrJgjcEGnCyMufWPHSFcMkdP',
      signOptions: { expiresIn: '7d' }, // مدة صلاحية التوكن
    }),
  ],
  providers: [JwtStrategy, AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
