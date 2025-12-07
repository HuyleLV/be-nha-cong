import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThuChi } from './entities/thu-chi.entity';
import { ThuChiItem } from './entities/thu-chi-item.entity';
import { ThuChiService } from './thu-chi.service';
import { ThuChiController } from './thu-chi.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ThuChi, ThuChiItem])],
  controllers: [ThuChiController],
  providers: [ThuChiService],
  exports: [TypeOrmModule],
})
export class ThuChiModule {}
