import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deposit } from './entities/deposit.entity';
import { User } from '../users/entities/user.entity';
import { Apartment } from '../apartment/entities/apartment.entity';
import { DepositsService } from './deposits.service';
import { DepositsController } from './deposits.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Deposit, User, Apartment])],
  providers: [DepositsService],
  controllers: [DepositsController],
  exports: [DepositsService],
})
export class DepositsModule {}
