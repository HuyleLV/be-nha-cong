import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { News } from './entities/news.entity';

@Module({
  imports: [TypeOrmModule.forFeature([News])],
  providers: [NewsService],
  controllers: [NewsController],
  exports: [TypeOrmModule],
})
export class NewsModule {}
