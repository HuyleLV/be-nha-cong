import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import {
    Contract,
    ContractStatus,
} from '../contracts/entities/contract.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { RentCalculationService } from '../rent-calculation/rent-calculation.service';
import { RentSchedulesService } from '../rent-schedules/rent-schedules.service';

@Injectable()
export class AutomatedInvoiceService {
    private readonly logger = new Logger(AutomatedInvoiceService.name);

    constructor(
        @InjectRepository(Contract)
        private readonly contractRepo: Repository<Contract>,
        @InjectRepository(Invoice)
        private readonly invoiceRepo: Repository<Invoice>,
        private readonly rentCalculationService: RentCalculationService,
        private readonly rentSchedulesService: RentSchedulesService,
    ) { }

    /**
     * Cron job: Chạy mỗi ngày lúc 00:00 để tạo invoice tự động
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async generateInvoicesForDueSchedules() {
        this.logger.log('Starting automated invoice generation...');

        try {
            // 1. Lấy tất cả upcoming rent schedules (scheduled date <= today)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const schedules = await this.rentSchedulesService.getUpcoming(1000);
            const dueSchedules = schedules.filter(
                (s) => new Date(s.scheduledDate) <= today,
            );

            this.logger.log(`Found ${dueSchedules.length} due schedules`);

            // 2. Với mỗi schedule, tạo invoice nếu chưa có
            for (const schedule of dueSchedules) {
                try {
                    await this.processSchedule(schedule);
                } catch (error) {
                    this.logger.error(
                        `Failed to process schedule ${schedule.id}: ${error.message}`,
                    );
                }
            }

            this.logger.log('Automated invoice generation completed');
        } catch (error) {
            this.logger.error(
                `Error in automated invoice generation: ${error.message}`,
            );
        }
    }

    /**
     * Xử lý một rent schedule: tạo invoice nếu chưa có
     */
    private async processSchedule(schedule: any) {
        // Kiểm tra xem đã có invoice cho schedule này chưa
        if (schedule.invoiceId) {
            const existingInvoice = await this.invoiceRepo.findOne({
                where: { id: schedule.invoiceId } as any,
            });
            if (existingInvoice) {
                this.logger.log(
                    `Schedule ${schedule.id} already has invoice ${schedule.invoiceId}`,
                );
                return;
            }
        }

        // Lấy contract
        const contract = await this.contractRepo.findOne({
            where: { id: schedule.contractId } as any,
        });

        if (!contract || contract.status !== ContractStatus.ACTIVE) {
            this.logger.warn(
                `Contract ${schedule.contractId} is not active, skipping schedule ${schedule.id}`,
            );
            return;
        }

        // Tính period từ scheduled date
        const scheduledDate = new Date(schedule.scheduledDate);
        const period = `${scheduledDate.getFullYear()}-${String(
            scheduledDate.getMonth() + 1,
        ).padStart(2, '0')}`;

        // Kiểm tra xem đã có invoice cho period này chưa
        const existingInvoiceForPeriod = await this.invoiceRepo.findOne({
            where: {
                contractId: contract.id,
                period,
            } as any,
        });

        if (existingInvoiceForPeriod) {
            this.logger.log(
                `Invoice already exists for contract ${contract.id}, period ${period}`,
            );
            // Update schedule với invoice ID
            schedule.invoiceId = existingInvoiceForPeriod.id;
            // Use scheduleRepo from service via any cast or better solution in future
            const scheduleRepo = (this.rentSchedulesService as any)['scheduleRepo'];
            if (scheduleRepo) {
                await scheduleRepo.save(schedule);
            }
            return;
        }

        // Tạo invoice mới
        try {
            const invoice =
                await this.rentCalculationService.calculateAndCreateInvoice(
                    contract.id,
                    period,
                    contract.createdBy || null,
                );

            // Link schedule với invoice
            schedule.invoiceId = invoice.id;
            const scheduleRepo = (this.rentSchedulesService as any)['scheduleRepo'];
            if (scheduleRepo) {
                await scheduleRepo.save(schedule);
            }

            this.logger.log(
                `Created invoice ${invoice.id} for schedule ${schedule.id}`,
            );

            // TODO: Gửi notification cho tenant và landlord
        } catch (error) {
            this.logger.error(
                `Failed to create invoice for schedule ${schedule.id}: ${error.message}`,
            );
            throw error;
        }
    }

    /**
     * Manual trigger để tạo invoice cho một contract
     */
    async generateInvoiceForContract(
        contractId: number,
        period: string,
        userId?: number,
    ) {
        return this.rentCalculationService.calculateAndCreateInvoice(
            contractId,
            period,
            userId,
        );
    }
}
