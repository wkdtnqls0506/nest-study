import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService, // .env 파일을 로드할 수 있는 ConfigModule
    private readonly jwtService: JwtService, // JWT 생성 및 검증 -> 로그인 성공시 accessToken과 refreshToken을 생성해주는 역할을 해주고 있음
  ) {}

  parseBasicToken(rowToken: string) {
    // 1. 토큰을 ' ' 기준으로 split 한 후 토큰값만 추출 -> ['Basic', 'token']
    const basicSplit = rowToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다.');
    }

    const [_, token] = basicSplit;

    // 2. 추출한 토큰을 base64 디코딩해서 이메일과 비밀번호로 나눈다.
    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    // -> "email:password"
    const tokenSplit = decoded.split(':');

    if (tokenSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다.');
    }

    const [email, password] = tokenSplit;

    return { email, password };
  }

  // rowToken: Basic $token
  async register(rowToken: string) {
    const { email, password } = this.parseBasicToken(rowToken);

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (user) {
      throw new BadRequestException('이미 가입한 이메일입니다.');
    }

    const hash = await bcrypt.hash(
      password,
      this.configService.get<number>('HASH_ROUNDS'),
    );

    await this.userRepository.save({
      email,
      password: hash, // DB에 저장할 땐 암호화된 비밀번호를 저장
    });

    return this.userRepository.findOne({
      where: { email },
    });
  }

  async authenticate(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('잘못된 로그인 정보입니다.');
    }

    const passOk = await bcrypt.compare(password, user.password);

    if (!passOk) {
      throw new BadRequestException('잘못된 로그인 정보입니다.');
    }

    return user;
  }

  async issueToken(user: UserEntity, isRefreshToken: boolean) {
    const refreshTokenSecret = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET',
    );
    const accessTokenSecret = this.configService.get<string>(
      'ACCESS_TOKEN_SECRET',
    );

    return this.jwtService.signAsync(
      {
        sub: user.id, // 토큰의 소유자
        role: user.role, // 사용자의 권한 정보
        type: isRefreshToken ? 'refresh' : 'access', // 토큰의 유형을 구분하기 위한 값
      },
      {
        secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret, // .env에 정의된 시크릿 키를 사용하여 토큰 암호화
        expiresIn: isRefreshToken ? '24h' : 300, // 토큰의 만료 시간 설정
      },
    );
  }

  async login(rowToken: string) {
    const { email, password } = this.parseBasicToken(rowToken);

    const user = await this.authenticate(email, password);

    // JWT 생성
    return {
      refreshToken: await this.issueToken(user, true),
      accessToken: await this.issueToken(user, false),
    };
  }
}

/**
 * signAsync() 메서드를 사용하여 비동기적으로 토큰 생성 가능
 * 사용자 정보를 바탕으로 토큰에 담을 Payload와 토큰의 암호화를 위한 Secret Key 및 만료 시간 설정
 */
