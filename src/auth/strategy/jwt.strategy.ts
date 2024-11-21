import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      // Bearer $token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 어디에서부터 JWT를 가져올지 설정
      ignoreExpiration: false, // 만료된 JWT 허용 여부
      secretOrKey: configService.get<string>('ACCESS_TOKEN_SECRET'),
    });
  }

  validate(payload: any) {
    return payload;
  }
}
