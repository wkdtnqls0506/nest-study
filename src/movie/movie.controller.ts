import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieTitleValidationPipe } from './pipe/movie-title-validation.pipe';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entity/user.entity';
import { GetMoviesDto } from './dto/get-movies.dto';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor) // class-transformer를 사용하여 응답 데이터를 serialize
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @RBAC(Role.admin)
  @Post()
  // @UseGuards(AuthGuard)  // token 값을 넣지않고 요청을 보낼 경우, 403 Forbidden 에러 반환
  create(@Body() body: CreateMovieDto) {
    return this.movieService.create(body);
  }

  @Public()
  @Get()
  findAll(@Query() dto: GetMoviesDto) {
    return this.movieService.findAll(dto);
  }

  @Public()
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.movieService.findOne(id);
  }

  @RBAC(Role.admin)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateMovieDto) {
    return this.movieService.update(id, body);
  }

  @RBAC(Role.admin)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.remove(id);
  }
}
