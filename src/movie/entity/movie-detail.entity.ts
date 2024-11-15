import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MovieEntity } from './movie.entity';

@Entity('movie_detail')
export class MovieDetailEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  detail: string;

  @OneToOne(() => MovieEntity, (movie) => movie.id) // movie의 id와 연결
  movie: MovieEntity;
}
