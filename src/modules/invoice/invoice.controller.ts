import { Controller, UseGuards, Req, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InvoiceService } from './invoice.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@ApiTags('Invoices')
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly service: InvoiceService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Get()
  list(@Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    return this.service.listByUser(userId);
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
  update(@Param('id') id: string, @Body() dto: CreateInvoiceDto, @Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    return this.service.update(Number(id), dto, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    return this.service.remove(Number(id), userId);
  }
}
