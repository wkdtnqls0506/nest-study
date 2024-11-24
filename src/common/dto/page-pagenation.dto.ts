import { IsInt, IsOptional } from 'class-validator';

export class PagePaginationDto {
  @IsInt()
  @IsOptional()
  page: number = 1;

  @IsInt()
  @IsOptional()
  take: number = 5; // 한페이지당 5개의 데이터를 가져옴
}
