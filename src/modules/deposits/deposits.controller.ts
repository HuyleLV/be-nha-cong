import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Req, Query } from '@nestjs/common';
import { DepositsService } from './deposits.service';
import { ok } from '../../common/utils/response';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { UpdateDepositDto } from './dto/update-deposit.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/deposits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepositsController {
  constructor(private readonly svc: DepositsService) {}

  @Get()
  @Roles('admin','host')
  async findAll(@Query() query: any) {
    const page = query?.page ? Number(query.page) : undefined;
    const limit = query?.limit ? Number(query.limit) : undefined;
    const res = await this.svc.findAll({ page, limit });
    return ok(res.items, { total: res.total, page: res.page, limit: res.limit });
  }

  @Get(':id')
  @Roles('admin','host')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const item = await this.svc.findOne(id);
    return ok(item);
  }

  @Post()
  @Roles('admin','host')
  async create(@Req() req: any, @Body() dto: CreateDepositDto) {
    // Debug log to verify incoming payload (customerId should be present when selected in FE)
    // eslint-disable-next-line no-console
    console.log('DepositsController.create dto:', dto);
    const user = req?.user ?? null;
    const created = await this.svc.create(dto, user);
    return ok(created);
  }

  @Patch(':id')
  @Roles('admin','host')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDepositDto) {
    const updated = await this.svc.update(id, dto);
    return ok(updated);
  }

  @Delete(':id')
  @Roles('admin','host')
  async remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const result = await this.svc.remove(id, req.user);
    return ok(result);
  }
}
