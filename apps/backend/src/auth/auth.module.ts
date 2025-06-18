import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: 'YrJgjcEGnCyMufWPHSFcMkdP',
      signOptions: { expiresIn: '7d' }, // مدة صلاحية التوكن
    }),
  ],
  providers: [JwtStrategy, AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
