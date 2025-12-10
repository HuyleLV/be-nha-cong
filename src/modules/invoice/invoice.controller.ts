import { Controller, UseGuards, Req, Get, Post, Body, Param, Patch, Delete, Query, HttpException, InternalServerErrorException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InvoiceService } from './invoice.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@ApiTags('Invoices')
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly service: InvoiceService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Get()
  list(@Req() req: any, @Query() q: any) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    return this.service.listByUser(userId, q);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Get(':id')
  get(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    return this.service.getOne(Number(id), userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Post()
  create(@Body() dto: CreateInvoiceDto, @Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    return this.service.create(dto, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto, @Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    try {
      return await this.service.update(Number(id), dto, userId);
    } catch (err: any) {
      // If it's already an HttpException, rethrow to preserve status
      if (err instanceof HttpException) throw err;
      // Provide clearer error message for client while avoiding full stack exposure
      const reason = err?.message || (err?.toString && String(err)) || 'Unknown error';
      // If TypeORM returned a driver error, include brief detail if available
      const detail = err?.driverError?.detail || err?.detail || null;
      const payload: any = { message: 'Cập nhật hóa đơn thất bại', reason };
      if (detail) payload.detail = detail;
      throw new InternalServerErrorException(payload);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    return this.service.remove(Number(id), userId);
  }
}
