import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RBAC } from '../decorator/rbac.decorator';
import { Role } from 'src/user/entity/user.entity';

// 사용자 권한에 따라 특정 엔드포인트에 접근을 제한하는 역할
@Injectable()
export class RBACGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const role = this.reflector.get(RBAC, context.getHandler());

    // Role Enum에 해당되는 값이 데코레이터에 들어갔는지 확인
    if (!Object.values(Role).includes(role)) return true;

    const request = context.switchToHttp().getRequest();
    console.log('request: ', request);

    const user = request.user;
    console.log('user: ', user);

    // Auth Guard를 통과했는지?
    if (!user) return false;

    return user.role <= role;
  }
}
