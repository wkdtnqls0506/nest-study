import { Exclude, Transform } from 'class-transformer';

export class MovieEntity {
  id: number;
  title: string;

  //   @Transform(({ value }) => value.toUpperCase()) // 값을 변환시키고 싶을 때 사용
  //   @Exclude() // 값을 노출시키고 싶지 않을 때 사용 (외부에 노출되지 않았으면 하는 필드에 사용)
  genre: string;
}
