import { Module } from '@nestjs/common';
import { DirectorService } from './director.service';
import { DirectorController } from './director.controller';
import { DirectorEntity } from './entity/director.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([DirectorEntity])], // 자동으로 Repository를 주입해줌
  controllers: [DirectorController],
  providers: [DirectorService],
})
export class DirectorModule {}
