import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThan } from 'typeorm';
import {
    RentSchedule,
    RentScheduleStatus,
} from './entities/rent-schedule.entity';
import {
    Contract,
    ContractStatus,
} from '../contracts/entities/contract.entity';

@Injectable()
export class RentSchedulesService {
    constructor(
        @InjectRepository(RentSchedule)
        private readonly scheduleRepo: Repository<RentSchedule>,
        @InjectRepository(Contract)
        private readonly contractRepo: Repository<Contract>,
    ) { }

    /**
     * Tạo rent schedule cho một contract
     */
    async createScheduleForContract(contractId: number): Promise<RentSchedule[]> {
        const contract = await this.contractRepo.findOne({
            where: { id: contractId } as any,
        });

        if (!contract || !contract.apartmentId || !contract.customerId) {
            throw new Error(`Invalid contract ${contractId}`);
        }

        if (contract.status !== ContractStatus.ACTIVE) {
            return []; // Chỉ tạo schedule cho active contracts
        }

        if (!contract.billingStartDate || !contract.paymentCycle) {
            return []; // Cần có billing start date và payment cycle
        }

        const schedules: RentSchedule[] = [];
        const startDate = new Date(contract.billingStartDate);
        const endDate = contract.expiryDate
            ? new Date(contract.expiryDate)
            : new Date(
                startDate.getFullYear() + 1,
                startDate.getMonth(),
                startDate.getDate(),
            );

        let currentDate = new Date(startDate);
        let scheduleNumber = 1;

        while (currentDate <= endDate) {
            // Kiểm tra xem đã có schedule cho date này chưa
            const existing = await this.scheduleRepo.findOne({
                where: {
                    contractId,
                    scheduledDate: currentDate,
                } as any,
            });

            if (!existing) {
                const schedule = this.scheduleRepo.create({
                    contractId,
                    apartmentId: contract.apartmentId,
                    customerId: contract.customerId,
                    scheduledDate: currentDate,
                    amount: contract.rentAmount || '0',
                    status: RentScheduleStatus.PENDING,
                } as any);

                schedules.push(schedule as unknown as RentSchedule);
            }

            // Tính next scheduled date
            if (contract.paymentCycle === 'monthly') {
                currentDate = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                    currentDate.getDate(),
                );
            } else if (contract.paymentCycle === 'quarterly') {
                currentDate = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 3,
                    currentDate.getDate(),
                );
            } else {
                break; // Unknown payment cycle
            }

            scheduleNumber++;
        }

        if (schedules.length > 0) {
            return this.scheduleRepo.save(schedules);
        }

        return [];
    }

    /**
     * Lấy upcoming rent schedules
     */
    async getUpcoming(limit: number = 10): Promise<RentSchedule[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.scheduleRepo.find({
            where: {
                status: RentScheduleStatus.PENDING,
                scheduledDate: MoreThan(today),
            } as any,
            order: { scheduledDate: 'ASC' },
            take: limit,
        });
    }

    /**
     * Lấy overdue rent schedules
     */
    async getOverdue(): Promise<RentSchedule[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.scheduleRepo.find({
            where: {
                status: RentScheduleStatus.PENDING,
                scheduledDate: LessThanOrEqual(today),
            } as any,
            order: { scheduledDate: 'ASC' },
        });
    }

    /**
     * Mark schedule as paid khi payment received
     */
    async markAsPaid(
        scheduleId: number,
        paymentId: number,
        invoiceId?: number,
    ): Promise<RentSchedule> {
        const schedule = await this.scheduleRepo.findOne({
            where: { id: scheduleId } as any,
        });

        if (!schedule) {
            throw new Error(`Schedule ${scheduleId} not found`);
        }

        schedule.status = RentScheduleStatus.PAID;
        schedule.paymentId = paymentId;
        if (invoiceId) {
            schedule.invoiceId = invoiceId;
        }

        return this.scheduleRepo.save(schedule);
    }

    /**
     * Update schedule status to overdue
     */
    async markAsOverdue(scheduleId: number): Promise<RentSchedule> {
        const schedule = await this.scheduleRepo.findOne({
            where: { id: scheduleId } as any,
        });

        if (!schedule) {
            throw new Error(`Schedule ${scheduleId} not found`);
        }

        schedule.status = RentScheduleStatus.OVERDUE;
        return this.scheduleRepo.save(schedule);
    }

    /**
     * Lấy schedules cho một contract
     */
    async findByContract(contractId: number): Promise<RentSchedule[]> {
        return this.scheduleRepo.find({
            where: { contractId } as any,
            order: { scheduledDate: 'ASC' },
        });
    }

    /**
     * Lấy schedules cho một customer
     */
    async findByCustomer(customerId: number): Promise<RentSchedule[]> {
        return this.scheduleRepo.find({
            where: { customerId } as any,
            order: { scheduledDate: 'DESC' },
        });
    }
}
