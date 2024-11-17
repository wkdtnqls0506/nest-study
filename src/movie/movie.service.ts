import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieEntity } from './entity/movie.entity';
import { In, Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MovieDetailEntity } from './entity/movie-detail.entity';
import { DirectorEntity } from 'src/director/entity/director.entity';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(MovieEntity)
    private readonly movieRepository: Repository<MovieEntity>,
    @InjectRepository(MovieDetailEntity)
    private readonly movieDetailRepository: Repository<MovieDetailEntity>,
    @InjectRepository(DirectorEntity)
    private readonly directorRepository: Repository<DirectorEntity>,
  ) {}

  getManyMovies(title?: string) {
    if (!title) {
      return this.movieRepository.find({
        relations: ['director'], // director 정보도 함께 가져옴
      });
    }

    return this.movieRepository.find({
      where: {
        title: Like(`%${title}%`),
      },
      relations: ['director'],
    });
  }

  async getMovieById(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
      relations: ['detail', 'director'], // 같이 가져오고 싶은 값을 명시
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.');
    }

    return movie;
  }

  async createMovie(createMovieDto: CreateMovieDto) {
    const director = await this.directorRepository.findOne({
      where: {
        id: createMovieDto.directorId,
      },
    });

    if (!director) {
      throw new NotFoundException('존재하지 않는 감독 ID 값입니다.');
    }

    // 1. MovieDetailEntity 생성 및 저장 -> cascade가 활성화되지 않았다면, detail 객체를 미리 MovieDetailEntity에 저장하고, 저장된 인스턴스를 MovieEntity의 detail에 할당해야 함
    // const movieDetail = await this.movieDetailRepository.save({
    //   detail: createMovieDto.detail,
    // });

    // 2. MovieEntity에 detail 관계 설정
    const movie = await this.movieRepository.save({
      title: createMovieDto.title, // "겨울왕국3"
      genre: createMovieDto.genre, // "fantasy"
      // detail: movieDetail, // detail: { detail: "겨울왕국입니다.", id: 1 } - 객체 형태
      detail: {
        detail: createMovieDto.detail, // 새로운 MovieDetailEntity 생성 (cascade:true 덕분에 detail을 자동으로 MovieDetailEntity에 매핑)
      },
      director,
    });

    return movie;
  }

  async updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    // 업데이트 하고 싶은 기존 영화 데이터 조회
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail'],
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.');
    }

    let newDirector;

    const { detail, directorId, ...movieRest } = updateMovieDto;

    if (directorId) {
      const director = await this.directorRepository.findOne({
        where: {
          id: directorId,
        },
      });

      if (!director) {
        throw new NotFoundException('존재하지 않는 감독 ID 값입니다.');
      }

      newDirector = director;
    }

    const movieUpdateFields = {
      ...movieRest,
      ...(newDirector && { director: newDirector }),
    };

    // 데이터 업데이트 (수정된 Entity 전체 반환 X)
    await this.movieRepository.update(id, movieUpdateFields);

    if (detail) {
      await this.movieDetailRepository.update(
        {
          id: movie.detail.id,
        },
        { detail },
      );
    }

    // 업데이트된 영화 데이터 조회 및 반환
    const updatedMovie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail', 'director'],
    });

    return updatedMovie;
  }

  async deleteMovie(id: number) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail'],
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.');
    }

    await this.movieRepository.delete(id);
    await this.movieDetailRepository.delete(movie.detail.id);

    return id;
  }
}
