import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // 1. 요청에서 user 객체가 존재하는지 확인 -> 존재하는 것 자체가 인증된 것(Middleware에서 전부 검증 완료된 것)
    const request = context.switchToHttp().getRequest();

    if (!request.user || request.user.type !== 'access') {
      return false;
    }

    return true;
  }
}
