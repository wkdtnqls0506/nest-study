import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Public } from '../decorator/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 만약 public decotartion이라면, 모든 로직을 bypass
    const isPublic = this.reflector.get(Public, context.getHandler()); // @Public() decorator가 붙어있으면 객체를 반환하고, 붙어 있지 않다면 undefined를 반환

    if (isPublic) return true;

    // 요청에서 user 객체가 존재하는지 확인 -> 존재하는 것 자체가 인증된 것(Middleware에서 전부 검증 완료된 것)
    const request = context.switchToHttp().getRequest();

    if (!request.user || request.user.type !== 'access') {
      return false;
    }

    return true;
  }
}
