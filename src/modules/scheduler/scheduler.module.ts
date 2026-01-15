import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankAccount } from '../bank-accounts/entities/bank-account.entity';
import { DailyCashbook } from '../bank-accounts/entities/daily-cashbook.entity';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [TypeOrmModule.forFeature([BankAccount, DailyCashbook]), BankAccountsModule],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
