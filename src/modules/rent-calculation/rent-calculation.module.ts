import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentCalculationService } from './rent-calculation.service';
import { Contract } from '../contracts/entities/contract.entity';
import { Apartment } from '../apartment/entities/apartment.entity';
import { MeterReading } from '../meter-reading/entities/meter-reading.entity';
import { InvoiceModule } from '../invoice/invoice.module';
import { RentSchedulesModule } from '../rent-schedules/rent-schedules.module';
import { RentCalculationController } from './rent-calculation.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Contract, Apartment, MeterReading]),
        InvoiceModule,
        RentSchedulesModule,
    ],
    controllers: [RentCalculationController],
    providers: [RentCalculationService],
    exports: [RentCalculationService],
})
export class RentCalculationModule { }
