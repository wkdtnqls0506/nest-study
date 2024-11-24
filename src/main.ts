import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // 데이터 검증과 변환을 수행하는 파이프

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 전역으로 설정하여 모든 요청에 대해 자동으로 적용
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 정의하지 않은 값들은 전달되지 않도록 설정 (default: false)
      forbidNonWhitelisted: true, // whitelist에 정의되지 않은 값이 들어오면 에러 발생 (default: false)
      transformOptions: {
        enableImplicitConversion: true, // 문자열로 전달되는 HTTP 요청을 DTO에서 지정한 타입에 따라 자동으로 변환
      },
    }),
  );
  await app.listen(3000);
}
bootstrap();
