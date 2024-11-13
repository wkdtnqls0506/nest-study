import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 정의하지 않은 값들은 전달되지 않도록 설정 (default: false)
    }),
  );
  await app.listen(3000);
}
bootstrap();
