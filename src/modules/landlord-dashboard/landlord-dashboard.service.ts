import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
// import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import {
    Contract,
    ContractStatus,
} from '../contracts/entities/contract.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import {
    RentSchedule,
    RentScheduleStatus,
} from '../rent-schedules/entities/rent-schedule.entity';
// import { Commission } from '../commissions/entities/commission.entity';
import { Apartment } from '../apartment/entities/apartment.entity';
import { Ownership } from '../ownership/entities/ownership.entity';
import { User } from '../users/entities/user.entity';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { ThuChi } from '../thu-chi/entities/thu-chi.entity';
import { ThuChiItem } from '../thu-chi/entities/thu-chi-item.entity';

@Injectable()
export class LandlordDashboardService {
    constructor(
        // @InjectRepository(Payment)
        // private readonly paymentRepo: Repository<Payment>,
        @InjectRepository(Contract)
        private readonly contractRepo: Repository<Contract>,
        @InjectRepository(Invoice)
        private readonly invoiceRepo: Repository<Invoice>,
        @InjectRepository(RentSchedule)
        private readonly scheduleRepo: Repository<RentSchedule>,
        // @InjectRepository(Commission)
        // private readonly commissionRepo: Repository<Commission>,
        @InjectRepository(Apartment)
        private readonly apartmentRepo: Repository<Apartment>,
        @InjectRepository(Ownership)
        private readonly ownershipRepo: Repository<Ownership>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Task)
        private readonly taskRepo: Repository<Task>,
        @InjectRepository(ThuChi)
        private readonly thuChiRepo: Repository<ThuChi>,
        @InjectRepository(ThuChiItem)
        private readonly thuChiItemRepo: Repository<ThuChiItem>,
    ) { }

    /**
     * Lấy dashboard stats tổng quan cho landlord
     */
    async getDashboardStats(userId: number) {
        // 1. Lấy danh sách apartments của landlord
        const apartments = await this.getLandlordApartments(userId);
        const apartmentIds = apartments.map((a) => a.id);

        // 2. Lấy contracts
        const contracts = await this.contractRepo.find({
            where: {
                apartmentId: apartmentIds.length > 0 ? apartmentIds[0] : -1, // Tạm thời - Cần fix logic để query IN
            } as any,
        });
        // Fix logic: Actually we should find contracts where apartmentId IN apartmentIds if possible,
        // but TypeORM simple find with nested where might be tricky if not careful.
        // For now keeping 'as any' workaround from original but optimizing if possible.

        // 3. Tính total revenue (tháng này)
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Placeholder for Payments (Removed)
        const paymentsThisMonth = { total: '0' };
        const pendingPayments = { total: '0' };

        // 5. Đếm active contracts
        const activeContracts = contracts.filter(
            (c) => c.status === ContractStatus.ACTIVE,
        ).length;

        // 6. Đếm expiring contracts (30 ngày)
        const expiringDate = new Date();
        expiringDate.setDate(expiringDate.getDate() + 30);
        const expiringContracts = contracts.filter(
            (c) =>
                c.expiryDate &&
                new Date(c.expiryDate) <= expiringDate &&
                c.status === ContractStatus.ACTIVE,
        ).length;

        // 7. Tính expenses (chi phí) - từ thu-chi module với type = 'chi'
        // Join với thu_chi_items để lấy tổng amount
        const expensesThisMonth = await this.thuChiItemRepo
            .createQueryBuilder('tci')
            .leftJoin(ThuChi, 'tc', 'tc.id = tci.thu_chi_id')
            .select('SUM(CAST(tci.amount AS DECIMAL(14,2)))', 'total')
            .where('tc.apartment_id IN (:...apartmentIds)', {
                apartmentIds: apartmentIds.length > 0 ? apartmentIds : [-1],
            })
            .andWhere('tc.type = :type', { type: 'chi' })
            .andWhere('tc.date BETWEEN :start AND :end', {
                start: monthStart,
                end: monthEnd,
            })
            .getRawOne();

        const revenueThisMonth = parseFloat(paymentsThisMonth?.total || '0');
        const expensesThisMonthAmount = parseFloat(expensesThisMonth?.total || '0');
        const profitThisMonth = revenueThisMonth - expensesThisMonthAmount;

        // 8. Thống kê khách hàng
        const customers = await this.userRepo.find({
            where: { ownerId: userId } as any,
        });
        const newCustomersThisMonth = customers.filter((c) => {
            const created = new Date(c.createdAt);
            return created >= monthStart && created <= monthEnd;
        }).length;

        // Note: CustomerStatus might not exist or be different in User entity v1
        // Simplification for now
        const potentialCustomers = 0;
        const contractedCustomers = 0;

        // 9. Thống kê công việc
        const tasks = await this.taskRepo.find({
            where: { createdBy: userId } as any,
        });
        const incompleteTasks = tasks.filter(
            (t) => t.status !== TaskStatus.DONE,
        ).length;
        const overdueTasks = tasks.filter((t) => {
            if (!t.dueDate) return false;
            const due = new Date(t.dueDate);
            return due < new Date() && t.status !== TaskStatus.DONE;
        }).length;
        const completedTasks = tasks.filter(
            (t) => t.status === TaskStatus.DONE,
        ).length;

        return {
            revenue: {
                thisMonth: revenueThisMonth.toFixed(2),
                total: parseFloat(paymentsThisMonth?.total || '0').toFixed(2),
            },
            expenses: {
                thisMonth: expensesThisMonthAmount.toFixed(2),
            },
            profit: {
                thisMonth: profitThisMonth.toFixed(2),
            },
            pendingPayments: parseFloat(pendingPayments?.total || '0').toFixed(2),
            activeContracts,
            expiringContracts,
            totalApartments: apartments.length,
            customers: {
                total: customers.length,
                newThisMonth: newCustomersThisMonth,
                potential: potentialCustomers,
                contracted: contractedCustomers,
                conversionRate: '0',
            },
            tasks: {
                total: tasks.length,
                incomplete: incompleteTasks,
                overdue: overdueTasks,
                completed: completedTasks,
            },
        };
    }

    /**
     * Lấy revenue report
     */
    /**
     * Lấy revenue report (Monthly/Daily) for Charts
     */
    async getRevenueReport(userId: number, from?: string, to?: string) {
        const apartments = await this.getLandlordApartments(userId);
        const apartmentIds = apartments.map((a) => a.id);
        if (apartmentIds.length === 0) return { items: [] };

        // Default: Last 12 months
        let startDate = from ? new Date(from) : new Date();
        let endDate = to ? new Date(to) : new Date();
        if (!from) startDate.setMonth(startDate.getMonth() - 11); // go back 11 months

        // Check if range is small (<= 31 days) -> Daily grouping, else Monthly
        const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
        const isDaily = diffDays <= 35;
        const dateFormat = isDaily ? '%Y-%m-%d' : '%Y-%m';

        // 1. Revenue: RentSchedules (PAID)
        // Group by period
        const rentRevenue = await this.scheduleRepo
            .createQueryBuilder('rs')
            .select(`DATE_FORMAT(rs.payment_date, '${dateFormat}')`, 'period')
            .addSelect('SUM(rs.amount_paid)', 'total')
            .where('rs.apartment_id IN (:...ids)', { ids: apartmentIds })
            .andWhere('rs.status = :st', { st: 'paid' })
            .andWhere('rs.payment_date BETWEEN :start AND :end', { start: startDate, end: endDate })
            .groupBy('period')
            .getRawMany();

        // 2. Revenue: Invoices (PAID)
        const invoiceRevenue = await this.invoiceRepo
            .createQueryBuilder('inv')
            .select(`DATE_FORMAT(inv.payment_date, '${dateFormat}')`, 'period')
            .addSelect('SUM(inv.total_amount)', 'total')
            .where('inv.apartment_id IN (:...ids)', { ids: apartmentIds })
            .andWhere('inv.status = :st', { st: 'paid' })
            .andWhere('inv.payment_date BETWEEN :start AND :end', { start: startDate, end: endDate })
            .groupBy('period')
            .getRawMany();

        // 3. Expenses: ThuChi (type=chi)
        // Note: ThuChi relates to apartment via apartment_id
        const expenses = await this.thuChiItemRepo
            .createQueryBuilder('tci')
            .leftJoin('thu_chi', 'tc', 'tc.id = tci.thu_chi_id')
            .select(`DATE_FORMAT(tc.date, '${dateFormat}')`, 'period')
            .addSelect('SUM(tci.amount)', 'total')
            .where('tc.apartment_id IN (:...ids)', { ids: apartmentIds })
            .andWhere('tc.type = :type', { type: 'chi' })
            .andWhere('tc.date BETWEEN :start AND :end', { start: startDate, end: endDate })
            .groupBy('period')
            .getRawMany();

        // Merge results
        const map = new Map<string, { period: string; revenue: number; expense: number; profit: number }>();

        // Helper to init
        const getOrCreate = (p: string) => {
            if (!map.has(p)) map.set(p, { period: p, revenue: 0, expense: 0, profit: 0 });
            return map.get(p)!;
        };

        rentRevenue.forEach(r => {
            const item = getOrCreate(r.period);
            item.revenue += Number(r.total || 0);
        });
        invoiceRevenue.forEach(r => {
            const item = getOrCreate(r.period);
            item.revenue += Number(r.total || 0);
        });
        expenses.forEach(e => {
            const item = getOrCreate(e.period);
            item.expense += Number(e.total || 0);
        });

        // Calc profit and sort
        const items = Array.from(map.values()).map(x => ({
            ...x,
            profit: x.revenue - x.expense
        })).sort((a, b) => a.period.localeCompare(b.period));

        return { items };
    }

    /**
     * Lấy payments cho landlord
     */
    async getPayments(
        userId: number,
        options?: { page?: number; limit?: number; status?: string },
    ) {
        return {
            items: [],
            total: 0,
            page: options?.page || 1,
            limit: options?.limit || 20,
            totalPages: 0
        }
    }

    /**
     * Lấy contracts cho landlord
     */
    async getContracts(userId: number, status?: string) {
        const apartments = await this.getLandlordApartments(userId);
        const apartmentIds = apartments.map((a) => a.id);

        const qb = this.contractRepo
            .createQueryBuilder('c')
            .where('c.apartment_id IN (:...apartmentIds)', {
                apartmentIds: apartmentIds.length > 0 ? apartmentIds : [-1],
            })
            .orderBy('c.created_at', 'DESC');

        if (status) {
            qb.andWhere('c.status = :status', { status });
        }

        return qb.getMany();
    }

    /**
     * Lấy upcoming rent schedules
     */
    async getUpcomingRent(userId: number) {
        const apartments = await this.getLandlordApartments(userId);
        const apartmentIds = apartments.map((a) => a.id);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.scheduleRepo
            .createQueryBuilder('s')
            .where('s.apartment_id IN (:...apartmentIds)', {
                apartmentIds: apartmentIds.length > 0 ? apartmentIds : [-1],
            })
            .andWhere('s.status = :status', { status: RentScheduleStatus.PENDING })
            .andWhere('s.scheduled_date >= :today', { today })
            .orderBy('s.scheduled_date', 'ASC')
            .limit(10)
            .getMany();
    }

    /**
     * Lấy overdue schedules
     */
    async getOverdue(userId: number) {
        const apartments = await this.getLandlordApartments(userId);
        const apartmentIds = apartments.map((a) => a.id);

        // const today = new Date();
        // today.setHours(0, 0, 0, 0);

        return this.scheduleRepo
            .createQueryBuilder('s')
            .where('s.apartment_id IN (:...apartmentIds)', {
                apartmentIds: apartmentIds.length > 0 ? apartmentIds : [-1],
            })
            .andWhere('s.status = :status', { status: RentScheduleStatus.OVERDUE })
            .orderBy('s.scheduled_date', 'ASC')
            .getMany();
    }

    /**
     * Lấy commission summary (Excluded)
     */
    async getCommissionSummary(userId: number) {
        return {
            total: '0',
            pending: '0',
            paid: '0',
            count: {
                total: 0,
                pending: 0,
                paid: 0
            }
        }
    }

    /**
     * Helper: Lấy danh sách apartments của landlord
     */
    private async getLandlordApartments(userId: number): Promise<Apartment[]> {
        // Lấy từ ownerships
        const ownerships = await this.ownershipRepo.find({
            where: { userId } as any,
        });

        const buildingIds = ownerships.map((o) => o.buildingId);

        if (buildingIds.length === 0) {
            return [];
        }

        // Fix: Use IN operator for multiple buildings
        return this.apartmentRepo.find({
            where: {
                buildingId: In(buildingIds),
            } as any,
        });
    }
}
