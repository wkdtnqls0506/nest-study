import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovieController } from './movie.controller';
import { MovieEntity } from './entity/movie.entity';
import { MovieDetailEntity } from './entity/movie-detail.entity';
import { DirectorEntity } from 'src/director/entity/director.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MovieEntity, MovieDetailEntity, DirectorEntity]),
  ], // 자동으로 Movie Repository를 주입해줌
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
