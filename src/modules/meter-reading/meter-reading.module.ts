import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeterReading } from './entities/meter-reading.entity';
import { MeterReadingItem } from './entities/meter-reading-item.entity';
import { MeterReadingService } from './meter-reading.service';
import { MeterReadingController } from './meter-reading.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MeterReading, MeterReadingItem])],
  providers: [MeterReadingService],
  controllers: [MeterReadingController],
  exports: [MeterReadingService],
})
export class MeterReadingModule {}
