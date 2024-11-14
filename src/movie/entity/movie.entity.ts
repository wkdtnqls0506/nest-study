import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity('movie')
export class MovieEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}

//   @Transform(({ value }) => value.toUpperCase()) // 값을 변환시키고 싶을 때 사용
//   @Exclude() // 값을 노출시키고 싶지 않을 때 사용 (외부에 노출되지 않았으면 하는 필드에 사용)
