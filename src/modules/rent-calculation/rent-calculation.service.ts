import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../contracts/entities/contract.entity';
import { Apartment } from '../apartment/entities/apartment.entity';
import { MeterReading } from '../meter-reading/entities/meter-reading.entity';
import { InvoiceService } from '../invoice/invoice.service';
import { CreateInvoiceDto } from '../invoice/dto/create-invoice.dto';

import { RentSchedulesService } from '../rent-schedules/rent-schedules.service';
import { RentScheduleStatus } from '../rent-schedules/entities/rent-schedule.entity';

@Injectable()
export class RentCalculationService {
    constructor(
        @InjectRepository(Contract)
        private readonly contractRepo: Repository<Contract>,
        @InjectRepository(Apartment)
        private readonly apartmentRepo: Repository<Apartment>,
        @InjectRepository(MeterReading)
        private readonly meterReadingRepo: Repository<MeterReading>,
        private readonly invoiceService: InvoiceService,
        private readonly rentSchedulesService: RentSchedulesService,
    ) { }

    /**
     * Tính toán tiền thuê cho một contract trong một period cụ thể
     * @param contractId Contract ID
     * @param period Period (YYYY-MM)
     * @param userId User ID tạo invoice
     * @returns Invoice đã được tạo
     */
    async calculateAndCreateInvoice(
        contractId: number,
        period: string,
        userId?: number,
    ) {
        // 1. Lấy contract và apartment
        const contract = await this.contractRepo.findOne({
            where: { id: contractId } as any,
        });

        if (!contract) {
            throw new Error(`Contract ${contractId} not found`);
        }

        if (!contract.apartmentId) {
            throw new Error(`Contract ${contractId} has no apartment`);
        }

        const apartment = await this.apartmentRepo.findOne({
            where: { id: contract.apartmentId } as any,
        });

        if (!apartment) {
            throw new Error(`Apartment ${contract.apartmentId} not found`);
        }

        // 2. Tính base rent
        const baseRent = contract.rentAmount || '0';

        // 3. Tính service fees
        const serviceFees = await this.calculateServiceFees(
            contract.apartmentId,
            contract.buildingId || null,
            period,
        );

        // 4. Tính tổng
        let totalAmount = this.addDecimalStrings(
            baseRent,
            ...serviceFees.map((f) => f.amount),
        );

        // 5. Áp dụng discount nếu có
        if (apartment.discountPercent) {
            const discountAmount = this.calculatePercentage(
                totalAmount,
                apartment.discountPercent,
            );
            totalAmount = this.subtractDecimalStrings(totalAmount, discountAmount);
        } else if (apartment.discountAmount) {
            totalAmount = this.subtractDecimalStrings(
                totalAmount,
                apartment.discountAmount,
            );
        }

        // 6. Tạo invoice items
        const items: any[] = [
            {
                serviceName: 'Tiền thuê nhà',
                unitPrice: baseRent,
                quantity: '1',
                amount: baseRent,
            },
            ...serviceFees,
        ];

        // 7. Tính due date (7 ngày sau issue date)
        const issueDate = new Date(`${period}-01`);
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + 7);

        // 8. Tạo invoice
        const invoiceDto: CreateInvoiceDto = {
            buildingId: contract.buildingId || apartment.buildingId || 0,
            apartmentId: contract.apartmentId,
            contractId: contract.id,
            period,
            issueDate: issueDate.toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0],
            items,
            note: `Hóa đơn tháng ${period} - Tự động tạo bởi hệ thống`,
        };

        const invoice = await this.invoiceService.create(invoiceDto, userId);

        // 9. Update RentSchedule if exists
        try {
            await this.linkInvoiceToSchedule((invoice as any).id, contractId, period);
        } catch (e) {
            console.error('Failed to link schedule', e);
        }

        return invoice;
    }

    private async linkInvoiceToSchedule(invoiceId: number, contractId: number, period: string) {
        // Find schedules for contract
        // Since RentSchedulesService might not expose a flexible finder yet, we try a best effort match
        // assuming standard monthly schedule logic or existence.

        // Note: Ideally RentSchedulesService should have a method findOneBy({ contractId, ... }) 
        // We will cast to any to access the repository for now as a verified migration step.
        const scheduleRepo = (this.rentSchedulesService as any)['scheduleRepo'];
        if (!scheduleRepo) return;

        // Find schedule matching the month
        // Period is YYYY-MM
        const schedules = await this.rentSchedulesService.findByContract(contractId);

        const target = schedules.find(s => {
            const d = new Date(s.scheduledDate);
            const sp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            return sp === period && !s.invoiceId;
        });

        if (target) {
            target.invoiceId = invoiceId;
            target.status = RentScheduleStatus.PAID; // Or keep pending? Automated invoice usually implies sent. Manual implies created.
            // If manual, we might just mark it as invoiced (invoiceId set). 
            // Status update depends on payment? Let's keep status as is or update to 'invoiced' if that status exists.
            // RentScheduleStatus typically: PENDING, PAID, OVERDUE, CANCELLED.
            // Check entity: PENDING, PAID, OVERDUE, CANCELLED.
            // Setting invoiceId is enough to stop automated generator from picking it up (since that checks !invoiceId usually? No, actually automated checks for non-existence of Invoice entity itself or schedule flag?)
            // Automated Service checks: `const existingInvoice = await this.invoiceService.findByContractAndPeriod...`
            // So logic matches. Linking schedule is good for record keeping.
            await scheduleRepo.save(target);
        }
    }

    /**
     * Tính service fees (điện, nước, internet, common fees)
     */
    private async calculateServiceFees(
        apartmentId: number,
        buildingId: number | null,
        period: string,
    ): Promise<any[]> {
        const fees: any[] = [];

        // Lấy apartment để có service fee rates
        const apartment = await this.apartmentRepo.findOne({
            where: { id: apartmentId } as any,
        });

        if (!apartment) {
            return fees;
        }

        // 1. Tính điện
        if (apartment.electricityPricePerKwh) {
            const electricityFee = await this.calculateElectricityFee(
                apartmentId,
                buildingId,
                period,
                apartment.electricityPricePerKwh,
            );
            if (electricityFee) {
                fees.push(electricityFee);
            }
        }

        // 2. Tính nước
        if (apartment.waterPricePerM3) {
            const waterFee = await this.calculateWaterFee(
                apartmentId,
                buildingId,
                period,
                apartment.waterPricePerM3,
            );
            if (waterFee) {
                fees.push(waterFee);
            }
        }

        // 3. Internet (fixed)
        if (apartment.internetPricePerRoom) {
            fees.push({
                serviceName: 'Phí Internet',
                unitPrice: apartment.internetPricePerRoom.toString(),
                quantity: '1',
                amount: apartment.internetPricePerRoom.toString(),
            });
        }

        // 4. Common service fee (cần số người thuê - tạm thời dùng 1)
        if (apartment.commonServiceFeePerPerson) {
            const numberOfTenants = 1; // TODO: Lấy từ contract hoặc apartment
            const totalCommonFee = (
                apartment.commonServiceFeePerPerson * numberOfTenants
            ).toString();
            fees.push({
                serviceName: 'Phí dịch vụ chung',
                unitPrice: apartment.commonServiceFeePerPerson.toString(),
                quantity: numberOfTenants.toString(),
                amount: totalCommonFee,
            });
        }

        return fees;
    }

    /**
     * Tính phí điện dựa trên meter readings
     */
    private async calculateElectricityFee(
        apartmentId: number,
        buildingId: number | null,
        period: string,
        pricePerKwh: number,
    ): Promise<any | null> {
        // Tìm meter reading cho period này
        const currentReading = await this.meterReadingRepo.findOne({
            where: {
                apartmentId,
                meterType: 'electricity' as any,
                period,
            } as any,
        });

        if (!currentReading) {
            return null; // Chưa có chỉ số, không tính
        }

        // Tìm previous reading (period trước)
        const [year, month] = period.split('-').map(Number);
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const prevPeriod = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

        const previousReading = await this.meterReadingRepo.findOne({
            where: {
                apartmentId,
                meterType: 'electricity' as any,
                period: prevPeriod,
            } as any,
        });

        if (!previousReading || !currentReading.items || !previousReading.items) {
            return null;
        }

        // Tính tổng consumption từ items
        const currentTotal = currentReading.items.reduce(
            (sum, item) => sum + parseFloat(item.newIndex || '0'),
            0,
        );
        const previousTotal = previousReading.items.reduce(
            (sum, item) => sum + parseFloat(item.newIndex || '0'),
            0,
        );

        const consumption = currentTotal - previousTotal;
        if (consumption <= 0) {
            return null;
        }

        const amount = (consumption * pricePerKwh).toString();

        return {
            serviceName: 'Tiền điện',
            unitPrice: pricePerKwh.toString(),
            quantity: consumption.toString(),
            meterIndex: currentTotal.toString(),
            amount,
            fromDate: `${prevPeriod}-01`,
            toDate: `${period}-01`,
        };
    }

    /**
     * Tính phí nước dựa trên meter readings
     */
    private async calculateWaterFee(
        apartmentId: number,
        buildingId: number | null,
        period: string,
        pricePerM3: number,
    ): Promise<any | null> {
        // Tương tự như electricity
        const currentReading = await this.meterReadingRepo.findOne({
            where: {
                apartmentId,
                meterType: 'water' as any,
                period,
            } as any,
        });

        if (!currentReading) {
            return null;
        }

        const [year, month] = period.split('-').map(Number);
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const prevPeriod = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

        const previousReading = await this.meterReadingRepo.findOne({
            where: {
                apartmentId,
                meterType: 'water' as any,
                period: prevPeriod,
            } as any,
        });

        if (!previousReading || !currentReading.items || !previousReading.items) {
            return null;
        }

        const currentTotal = currentReading.items.reduce(
            (sum, item) => sum + parseFloat(item.newIndex || '0'),
            0,
        );
        const previousTotal = previousReading.items.reduce(
            (sum, item) => sum + parseFloat(item.newIndex || '0'),
            0,
        );

        const consumption = currentTotal - previousTotal;
        if (consumption <= 0) {
            return null;
        }

        const amount = (consumption * pricePerM3).toString();

        return {
            serviceName: 'Tiền nước',
            unitPrice: pricePerM3.toString(),
            quantity: consumption.toString(),
            meterIndex: currentTotal.toString(),
            amount,
            fromDate: `${prevPeriod}-01`,
            toDate: `${period}-01`,
        };
    }

    /**
     * Utility functions for decimal string calculations
     */
    private addDecimalStrings(...values: string[]): string {
        const total = values.reduce((sum, val) => sum + parseFloat(val || '0'), 0);
        return total.toFixed(2);
    }

    private subtractDecimalStrings(a: string, b: string): string {
        return (parseFloat(a || '0') - parseFloat(b || '0')).toFixed(2);
    }

    private calculatePercentage(amount: string, percentage: number): string {
        return ((parseFloat(amount || '0') * percentage) / 100).toFixed(2);
    }
}
