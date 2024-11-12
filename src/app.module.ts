import { Module } from '@nestjs/common';
import { MovieModule } from './movie/movie.module';

@Module({
  imports: [MovieModule],
  // controllers: [AppController],
  // providers: [AppService],
})
export class AppModule {}
