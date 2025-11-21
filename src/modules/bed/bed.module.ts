import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bed } from './entities/bed.entity';
import { BedService } from './bed.service';
import { BedController } from './bed.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Bed])],
  providers: [BedService],
  controllers: [BedController],
  exports: [BedService],
})
export class BedsModule {}
