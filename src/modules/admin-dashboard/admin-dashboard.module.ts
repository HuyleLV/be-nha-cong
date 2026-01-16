import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { User } from '../users/entities/user.entity';
import { Apartment } from '../apartment/entities/apartment.entity';
// import { VehicleBooking } from '../vehicle-bookings/entities/vehicle-booking.entity';
// import { Job } from '../jobs/entities/job.entity';
import { Contract } from '../contracts/entities/contract.entity';
// import { Payment } from '../payments/entities/payment.entity';
// import { ServiceBooking } from '../service-bookings/entities/service-booking.entity';
import { ServiceProvider } from '../service-providers/entities/service-provider.entity';
import { Building } from '../building/entities/building.entity';
import { Viewing } from '../viewings/entities/viewing.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Apartment,
            // VehicleBooking,
            // Job,
            Contract,
            // Payment,
            // ServiceBooking,
            ServiceProvider,
            Building,
            Viewing,
        ]),
    ],
    controllers: [AdminDashboardController],
    providers: [AdminDashboardService],
    exports: [AdminDashboardService],
})
export class AdminDashboardModule { }
