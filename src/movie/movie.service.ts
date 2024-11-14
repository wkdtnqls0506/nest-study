import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieEntity } from './entity/movie.entity';
import { Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(MovieEntity)
    private readonly movieRepository: Repository<MovieEntity>,
  ) {}

  getManyMovies(title?: string) {
    if (!title) {
      return this.movieRepository.find();
    }
    return this.movieRepository.find({
      where: {
        title: Like(`%${title}%`),
      },
    });
  }

  async getMovieById(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.');
    }

    return movie;
  }

  async createMovie(createMovieDto: CreateMovieDto) {
    const movie = await this.movieRepository.save(createMovieDto);

    return movie;
  }

  async updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    // 업데이트 하고 싶은 기존 영화 데이터 조회
    const movie = await this.movieRepository.findOne({ where: { id } });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.');
    }

    // 데이터 업데이트 (수정된 Entity 전체 반환 X)
    await this.movieRepository.update(id, updateMovieDto);

    // 업데이트된 영화 데이터 조회 및 반환
    const updatedMovie = await this.movieRepository.findOne({ where: { id } });
    return updatedMovie;
  }

  async deleteMovie(id: number) {
    const movie = await this.movieRepository.findOne({ where: { id } });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.');
    }

    await this.movieRepository.delete(id);

    return id;
  }
}
