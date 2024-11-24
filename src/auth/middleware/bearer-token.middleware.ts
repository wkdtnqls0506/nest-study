import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { envVariableKeys } from 'src/common/const/env.const';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Basic $token
    // Bearer $token
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      next();
      return;
    }

    /**
     * this.validateBearerToken에서 발생하는 예외는 try문 밖에서 발생하므로, Middleware에서 처리되지 않고 NestJS의 전역 예외 필터로 넘어갑니다.
     * 결과적으로, 잘못된 토큰 형식이 전달되면 Middleware 단계에서 즉시 요청이 종료되고, Guard까지 도달하지 못합니다.
     */
    // const token = this.validateBearerToken(authHeader);

    try {
      // try문 내부로 이동하며 모든 예외가 하나의 try-catch문에서 처리됩니다. -> 즉, 잘못된 토큰 형식도 다른 예외와 동일하게 처리 가능
      // 이 경우 에러를 발생시키지 않고 Middleware는 요청을 next()로 넘기며, Guard가 인증 여부를 최종적으로 판단하게 된다.
      const token = this.validateBearerToken(authHeader); // Guard의 역할과 Middleware의에 에러 처리의 책임을 분리하기 위해 위치 이동

      const decodedPayload = this.jwtService.decode(token);

      if (
        decodedPayload.type !== 'refresh' &&
        decodedPayload.type !== 'access'
      ) {
        throw new UnauthorizedException('잘못된 토큰입니다!');
      }

      const secretKey =
        decodedPayload.type === 'refresh'
          ? envVariableKeys.refreshTokenSecret
          : envVariableKeys.accessTokenSecret;

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(secretKey),
      });

      req.user = payload;
      next();
    } catch (e) {
      // throw new UnauthorizedException('토큰이 만료됐습니다!');
      next(); // error를 발생시키지 않고, 다음으로 넘김 -> Auth Guard
    }
  }

  // 토큰 파싱 및 검증 분리
  validateBearerToken(rawToken: string) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    const [bearer, token] = basicSplit;

    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    return token;
  }
}
