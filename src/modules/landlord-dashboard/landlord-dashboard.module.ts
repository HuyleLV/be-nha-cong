import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LandlordDashboardService } from './landlord-dashboard.service';
import { LandlordDashboardController } from './landlord-dashboard.controller';
// import { Payment } from '../payments/entities/payment.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { RentSchedule } from '../rent-schedules/entities/rent-schedule.entity';
// import { Commission } from '../commissions/entities/commission.entity';
import { Apartment } from '../apartment/entities/apartment.entity';
import { Ownership } from '../ownership/entities/ownership.entity';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { ThuChi } from '../thu-chi/entities/thu-chi.entity';
import { ThuChiItem } from '../thu-chi/entities/thu-chi-item.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            //   Payment,
            Contract,
            Invoice,
            RentSchedule,
            //   Commission,
            Apartment,
            Ownership,
            User,
            Task,
            ThuChi,
            ThuChiItem,
        ]),
    ],
    controllers: [LandlordDashboardController],
    providers: [LandlordDashboardService],
    exports: [LandlordDashboardService],
})
export class LandlordDashboardModule { }
