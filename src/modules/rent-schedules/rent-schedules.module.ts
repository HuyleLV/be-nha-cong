import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentSchedulesService } from './rent-schedules.service';
import { RentSchedule } from './entities/rent-schedule.entity';
import { Contract } from '../contracts/entities/contract.entity';

@Module({
    imports: [TypeOrmModule.forFeature([RentSchedule, Contract])],
    providers: [RentSchedulesService],
    exports: [RentSchedulesService],
})
export class RentSchedulesModule { }
