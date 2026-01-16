import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { Invoice } from '../invoice/entities/invoice.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { Asset } from '../asset/entities/asset.entity';
import { ThuChi } from '../thu-chi/entities/thu-chi.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Invoice, Contract, Asset, ThuChi]),
    ],
    controllers: [FinanceController],
    providers: [FinanceService],
    exports: [FinanceService],
})
export class FinanceModule { }
