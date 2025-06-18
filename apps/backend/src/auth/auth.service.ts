// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  // اختياري: دالة لإنشاء توكن
  generateToken(payload: any) {
    return this.jwtService.sign(payload);
  }

  // اختياري: دالة لفك التوكن بشكل يدوي
  verifyToken(token: string) {
    return this.jwtService.verify(token);
  }
}
