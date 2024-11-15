import { BaseEntity } from 'src/common/entity/base.entity';
import { MovieEntity } from 'src/movie/entity/movie.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('director')
export class DirectorEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  dob: Date;

  @Column()
  nationality: string;

  @OneToMany(() => MovieEntity, (movie) => movie.director)
  movies: MovieEntity[];
}
