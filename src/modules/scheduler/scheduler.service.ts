import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { BankAccount } from '../bank-accounts/entities/bank-account.entity';
import { DailyCashbook } from '../bank-accounts/entities/daily-cashbook.entity';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly bankAccountsService: BankAccountsService,
    @InjectRepository(BankAccount) private readonly bankRepo: Repository<BankAccount>,
    @InjectRepository(DailyCashbook) private readonly snapshotRepo: Repository<DailyCashbook>,
  ) {}

  // Run every day at 23:59 server local time
  @Cron('59 23 * * *')
  async handleDailyCashbookCron() {
    this.logger.log('Starting daily cashbook snapshot job');
    try {
      // find distinct owners who have accounts
      const raw = await this.bankRepo.createQueryBuilder('b').select('DISTINCT b.ownerId', 'ownerId').getRawMany();
      const ownerIds = raw.map(r => Number(r.ownerId)).filter(Boolean);
      const today = new Date();
      const fmt = (d: Date) => d.toISOString().slice(0,10);
      const dateStr = fmt(today);

      for (const ownerId of ownerIds) {
        try {
          const rows = await this.bankAccountsService.hostDailyCashbook(ownerId, dateStr, dateStr);
          // persist rows
          for (const r of rows) {
            const existing = await this.snapshotRepo.findOne({ where: { date: r.date, ownerId, accountId: r.accountId } });
            if (existing) continue; // avoid duplicates
            const ent = this.snapshotRepo.create({
              date: r.date,
              ownerId,
              accountId: r.accountId ?? null,
              accountLabel: r.accountLabel ?? '',
              startingBalance: String(r.startingBalance ?? 0),
              totalThu: String(r.totalThu ?? 0),
              totalChi: String(r.totalChi ?? 0),
              endingBalance: String(r.endingBalance ?? 0),
            } as any);
            await this.snapshotRepo.save(ent as any);
          }
        } catch (e) {
          this.logger.error('Failed to persist daily cashbook for owner ' + ownerId, e as any);
        }
      }
    } catch (e) {
      this.logger.error('Daily cashbook job failed', e as any);
    }
    this.logger.log('Daily cashbook snapshot job finished');
  }
}
