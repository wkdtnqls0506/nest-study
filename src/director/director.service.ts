import { Injectable } from '@nestjs/common';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DirectorEntity } from './entity/director.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DirectorService {
  constructor(
    @InjectRepository(DirectorEntity)
    private readonly directorRepository: Repository<DirectorEntity>,
  ) {}

  create(createDirectorDto: CreateDirectorDto) {
    return this.directorRepository.save(createDirectorDto);
  }

  findAll() {
    return this.directorRepository.find();
  }

  findOne(id: number) {
    return this.directorRepository.findOne({
      where: { id },
    });
  }

  async update(id: number, updateDirectorDto: UpdateDirectorDto) {
    // 1. 업데이트를 수행하기 전에, DB에서 id에 해당하는 감독 정보가 존재하는지 확인 -> 존재한다면 감독 정보 반환
    const director = await this.directorRepository.findOne({
      where: { id },
    });

    if (!director) {
      throw new Error('존재하지 않는 감독 ID입니다.');
    }

    // 2. 반환값으로 영향을 받은 레코드 수만 반환, 변경된 데이터를 반환하지 않음
    await this.directorRepository.update({ id }, { ...updateDirectorDto });

    // 3. 업데이트된 감독 정보를 다시 조회 -> update 메서드는 변경된 데이터를 반환하지 않으므로, findOne 메서드로 새로 업데이트 된 값을 확인
    const updateDirector = await this.directorRepository.findOne({
      where: { id },
    });

    return updateDirector;
  }

  async remove(id: number) {
    const director = await this.directorRepository.findOne({
      where: { id },
    });

    if (!director) {
      throw new Error('존재하지 않는 감독 ID입니다.');
    }

    await this.directorRepository.delete(id);

    return id;
  }
}
