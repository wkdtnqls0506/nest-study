import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { MovieDetailEntity } from './movie-detail.entity';

// ManyToOne Director -> 감독은 여러개의 영화를 만들 수 있음
// OneToOne MovieDetail -> 영화는 하나의 상세 내용을 가질 수 있음
// ManyToMany Genre -> 영화는 여러개의 장르를 가질 수 있고, 장르는 여러개의 영화를 가질 수 있음

@Entity('movie')
export class MovieEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;

  @OneToOne(() => MovieDetailEntity, (movieDetail) => movieDetail.id, {
    cascade: true,
  }) // movieDetail의 id와 연결
  @JoinColumn() // OneToOne 관계는 어떤 쪽에서 소유를 해야하는지 모르기 때문에 해당 어노테이션 무조건 사용
  detail: MovieDetailEntity; // detailId 생성됨
}

//   @Transform(({ value }) => value.toUpperCase()) // 값을 변환시키고 싶을 때 사용
//   @Exclude() // 값을 노출시키고 싶지 않을 때 사용 (외부에 노출되지 않았으면 하는 필드에 사용)
