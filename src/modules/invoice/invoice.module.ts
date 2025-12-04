import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceItem])],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [TypeOrmModule]
})
export class InvoiceModule {}
