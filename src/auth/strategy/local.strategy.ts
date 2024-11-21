import { Injectable } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

export class LocalAuthGuard extends AuthGuard('local') {}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  // Strategy에서 제공해주는 값으로 실제로 존재하는 사용자인지 검증
  /**
   * LocalStrategy
   * validate : username, password
   * validate()가 return한 값은 Request 객체에 들어가게 됨
   */
  async validate(email: string, password: string) {
    const user = await this.authService.authenticate(email, password);
    return user;
  }
}
