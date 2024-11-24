import { Injectable, NotFoundException, Module } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieEntity } from './entity/movie.entity';
import { DataSource, In, Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MovieDetailEntity } from './entity/movie-detail.entity';
import { DirectorEntity } from 'src/director/entity/director.entity';
import { GenreEntity } from 'src/genre/entity/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(MovieEntity)
    private readonly movieRepository: Repository<MovieEntity>,
    @InjectRepository(MovieDetailEntity)
    private readonly movieDetailRepository: Repository<MovieDetailEntity>,
    @InjectRepository(DirectorEntity)
    private readonly directorRepository: Repository<DirectorEntity>,
    @InjectRepository(GenreEntity)
    private readonly genreRepository: Repository<GenreEntity>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
  ) {}

  async findAll(dto: GetMoviesDto) {
    const { title } = dto;

    const qb = await this.movieRepository
      .createQueryBuilder('movie') // MovieEntity에 대한 QueryBuilder 생성
      .leftJoinAndSelect('movie.director', 'director') // relations: ['director']와 동일
      .leftJoinAndSelect('movie.genres', 'genres');

    if (title) {
      qb.where('movie.title like :title', { title: `%${title}%` });
    }

    // this.commonService.applyPagePaginationParamsToQb(qb, dto);
    this.commonService.applyCursorPaginationParamsToQb(qb, dto);

    return await qb.getManyAndCount();

    // if (!title) {
    //   return this.movieRepository.find({
    //     relations: ['director', 'genres'], // director 정보도 함께 가져옴
    //   });
    // }
    // return this.movieRepository.findAndCount({
    //   where: {
    //     title: Like(`%${title}%`),
    //   },
    //   relations: ['director', 'genres'],
    // });
  }

  async findOne(id: number) {
    const movie = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.detail', 'detail') // relations: ['director']와 동일
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .where('movie.id = :id', { id })
      .getOne();

    // const movie = await this.movieRepository.findOne({
    //   where: {
    //     id,
    //   },
    //   relations: ['detail', 'director', 'genres'], // 같이 가져오고 싶은 값을 명시
    // });
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.');
    }

    return movie;
  }

  async create(createMovieDto: CreateMovieDto) {
    const qr = this.dataSource.createQueryRunner(); // 트랜잭션을 위한 QueryRunner 생성
    await qr.connect(); // 데이터베이스 연결
    await qr.startTransaction(); // 트랜잭션 시작

    try {
      const director = await qr.manager.findOne(DirectorEntity, {
        where: {
          id: createMovieDto.directorId,
        },
      });

      if (!director) {
        throw new NotFoundException('존재하지 않는 감독 ID 값입니다.');
      }

      const genres = await qr.manager.find(GenreEntity, {
        where: {
          id: In(createMovieDto.genreIds), // WHERE id IN (1, 2, 3)
        },
      });

      if (genres.length !== createMovieDto.genreIds.length) {
        throw new NotFoundException(
          `존재하지 않는 장르가 존재합니다. 존재하는 ids => ${genres.map((genre) => genre.id).join(', ')}`,
        );
      }

      // 1. MovieDetailEntity 생성 및 저장 -> cascade가 활성화되지 않았다면, detail 객체를 미리 MovieDetailEntity에 저장하고, 저장된 인스턴스를 MovieEntity의 detail에 할당해야 함
      // const movieDetail = await this.movieDetailRepository.save({
      //   detail: createMovieDto.detail,
      // });

      // 2. MovieEntity에 detail 관계 설정
      // save() 할 때는 cascade로 한번에 조합이 되지만, QueryBuilder를 사용할 때는 따로 저장해서 권장하지 않음.
      const movieDetail = await qr.manager
        .createQueryBuilder()
        .insert()
        .into(MovieDetailEntity)
        .values({ detail: createMovieDto.detail })
        .execute();

      const movieDetailId = movieDetail.identifiers[0].id;

      const movie = await qr.manager
        .createQueryBuilder()
        .insert()
        .into(MovieEntity)
        .values({
          title: createMovieDto.title,
          detail: {
            id: movieDetailId,
          },
          director,
        })
        .execute();

      const movieId = movie.identifiers[0].id;

      await qr.manager
        .createQueryBuilder()
        .relation(MovieEntity, 'genres')
        .of(movieId)
        .add(genres.map((genre) => genre.id));

      // const movie = await this.movieRepository.save({
      //   title: createMovieDto.title, // "겨울왕국3"
      //   // detail: movieDetail, // detail: { detail: "겨울왕국입니다.", id: 1 } - 객체 형태
      //   detail: {
      //     detail: createMovieDto.detail, // 새로운 MovieDetailEntity 생성 (cascade:true 덕분에 detail을 자동으로 MovieDetailEntity에 매핑)
      //   },
      //   director,
      //   genres,
      // });

      await qr.commitTransaction();

      return await this.movieRepository.findOne({
        where: { id: movieId },
        relations: ['detail', 'director', 'genres'],
      });
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // 1. 수정할 영화를 movie 변수에 저장
      const movie = await qr.manager.findOne(MovieEntity, {
        where: { id },
        relations: ['detail', 'genres'],
      });

      // 2. 조회한 영화 데이터가 없는 경우의 예외 처리
      if (!movie) {
        throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.');
      }

      // 3. UpdateMovieDto에서 필요한 데이터 추출 - detail, directorId, genreIds는 관계 처리를 위해 별도로 사용
      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

      // 4. 감독이 업데이트 대상이라면? -> 수정할 감독 정보를 newDirector 변수에 저장
      let newDirector;

      if (directorId) {
        const director = await qr.manager.findOne(DirectorEntity, {
          where: {
            id: directorId,
          },
        });

        if (!director) {
          throw new NotFoundException('존재하지 않는 감독 ID 값입니다.');
        }

        newDirector = director;
      }

      // 5. 장르가 업데이트 대상이라면? -> 수정할 장르 정보를 newGenres 변수에 저장
      let newGenres;

      if (genreIds) {
        const genres = await qr.manager.find(GenreEntity, {
          where: {
            id: In(genreIds),
          },
        });

        if (genres.length !== updateMovieDto.genreIds.length) {
          throw new NotFoundException(
            `존재하지 않는 장르가 존재합니다. 존재하는 ids => ${genres.map((genre) => genre.id).join(', ')}`,
          );
        }

        newGenres = genres;
      }

      // 6. 업데이트할 필드 목록을 객체로 생성
      // newGenres가 movieUpdateFields에 포함되지 않는 이유? -> genres는 ManyToMany 관계로, movie.genres에 대한 업데이트는 별도로 처리해야 함
      const movieUpdateFields = {
        ...movieRest,
        ...(newDirector && { director: newDirector }),
      };

      // 데이터 업데이트 (수정된 Entity 전체 반환 X)
      // await this.movieRepository.update({ id }, movieUpdateFields);
      await qr.manager
        .createQueryBuilder()
        .update(MovieEntity)
        .set(movieUpdateFields)
        .where('id = :id', { id })
        .execute();

      if (detail) {
        // await this.movieDetailRepository.update(
        //   {
        //     id: movie.detail.id,
        //   },
        //   { detail },
        // );
        await qr.manager
          .createQueryBuilder()
          .update(MovieDetailEntity)
          .set({ detail })
          .where('id = :id', { id: movie.detail.id })
          .execute();
      }

      // 업데이트된 영화 데이터 조회 및 반환

      if (newGenres) {
        await qr.manager
          .createQueryBuilder()
          .relation(MovieEntity, 'genres')
          .of(id)
          .addAndRemove(
            newGenres.map((genre) => genre.id),
            movie.genres.map((genre) => genre.id),
          );
      }

      // const newMovie = await this.movieRepository.findOne({
      //   where: { id },
      //   relations: ['detail', 'director'],
      // });

      // newMovie.genres = newGenres;

      // await this.movieRepository.save(newMovie);

      await qr.commitTransaction();

      return this.movieRepository.findOne({
        where: { id },
        relations: ['detail', 'director', 'genres'],
      });
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }
  async remove(id: number) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail'],
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.');
    }

    // await this.movieRepository.delete(id);
    await this.movieRepository
      .createQueryBuilder()
      .delete()
      .where('id = :id', { id })
      .execute();

    await this.movieDetailRepository.delete(movie.detail.id);

    return id;
  }
}
