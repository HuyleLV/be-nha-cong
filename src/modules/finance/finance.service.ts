import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, Not, IsNull } from 'typeorm';
import { Invoice } from '../invoice/entities/invoice.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { Asset } from '../asset/entities/asset.entity';
import { ThuChi } from '../thu-chi/entities/thu-chi.entity';

@Injectable()
export class FinanceService {
    constructor(
        @InjectRepository(Invoice)
        private invoiceRepo: Repository<Invoice>,
        @InjectRepository(Contract)
        private contractRepo: Repository<Contract>,
        @InjectRepository(Asset)
        private assetRepo: Repository<Asset>,
        @InjectRepository(ThuChi)
        private thuChiRepo: Repository<ThuChi>,
    ) { }

    async getCashFlow(startDate: Date, endDate: Date, buildingId?: number) {
        // 1. Invoices (Paid)
        const paidInvoices = await this.invoiceRepo.find({
            where: {
                status: 'paid',
                paymentDate: Between(startDate, endDate),
                ...(buildingId ? { buildingId } : {}),
            },
            select: ['paidAmount', 'paymentDate']
        });
        const invoiceIncome = paidInvoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);

        // 2. ThuChi (Manual Income/Expense)
        const thuChiRecords = await this.thuChiRepo.find({
            where: {
                date: Between(startDate, endDate),
                ...(buildingId ? { buildingId } : {}),
            },
            relations: ['items']
        });

        // 'thu' = income, 'chi' = expense
        let manualIncome = 0;
        let manualExpense = 0;

        for (const record of thuChiRecords) {
            const recordTotal = record.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
            if (record.type === 'thu') {
                manualIncome += recordTotal;
            } else if (record.type === 'chi') {
                manualExpense += recordTotal;
            }
        }

        return {
            totalIncome: invoiceIncome + manualIncome,
            totalExpense: manualExpense,
            netFlow: (invoiceIncome + manualIncome) - manualExpense,
            breakdown: {
                invoiceIncome,
                manualIncome,
                manualExpense
            }
        };
    }

    async getProfitLoss(year: number, period?: string) {
        // Revenue = Issued Invoices (accrual basis)
        // Expense = ThuChi (Chi)

        // Build query range
        let startDate = new Date(year, 0, 1);
        let endDate = new Date(year, 11, 31);

        if (period) { // "MM" or "Q1-Q4"
            // TODO: precise date logic. For now supporting full year
        }

        const invoices = await this.invoiceRepo.find({
            where: {
                issueDate: Between(startDate, endDate)
            },
            select: ['totalAmount', 'issueDate']
        });
        const revenue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);

        const expenses = await this.thuChiRepo.find({
            where: {
                type: 'chi',
                date: Between(startDate, endDate)
            },
            relations: ['items']
        });

        let totalExpense = 0;
        for (const record of expenses) {
            totalExpense += record.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        }

        return {
            revenue,
            expense: totalExpense,
            profit: revenue - totalExpense
        };
    }

    async getDebts(page = 1, limit = 20) {
        // Invoices pending and overdue
        const [invoices, count] = await this.invoiceRepo.findAndCount({
            where: [
                { status: 'pending' },
                { status: 'overdue' }
            ],
            order: { dueDate: 'ASC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: [] // TODO: relations if needed (apartment, customer?)
        });

        return {
            data: invoices,
            total: count,
            page,
            lastPage: Math.ceil(count / limit)
        };
    }

    async getBrokerageFees(page = 1, limit = 20) {
        const [contracts, count] = await this.contractRepo.findAndCount({
            where: {
                // Using raw query for decimal comparison if needed, but TypeORM handles string numbers ok usually
                commissionAmount: Not('0.00'),
            },
            take: limit,
            skip: (page - 1) * limit
        });
        return {
            data: contracts,
            total: count
        };
    }

    async getAssetReport() {
        const assets = await this.assetRepo.find();
        const totalValue = assets.reduce((sum, a) => sum + Number(a.value || 0), 0);
        const count = assets.length;
        // Group by status
        const byStatus = assets.reduce((acc: any, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {});

        return {
            totalAssets: count,
            totalValue,
            byStatus
        };
    }
}
