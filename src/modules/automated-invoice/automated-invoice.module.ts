import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AutomatedInvoiceService } from './automated-invoice.service';
import { Contract } from '../contracts/entities/contract.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { RentCalculationModule } from '../rent-calculation/rent-calculation.module';
import { RentSchedulesModule } from '../rent-schedules/rent-schedules.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        TypeOrmModule.forFeature([Contract, Invoice]),
        RentCalculationModule,
        RentSchedulesModule,
    ],
    providers: [AutomatedInvoiceService],
    exports: [AutomatedInvoiceService],
})
export class AutomatedInvoiceModule { }
