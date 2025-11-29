import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
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
  async findAll() {
    const items = await this.svc.findAll();
    return ok(items);
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
    const created = await this.svc.create(dto);
    return ok(created);
  }

  @Patch(':id')
  @Roles('admin','host')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDepositDto) {
    const updated = await this.svc.update(id, dto);
    return ok(updated);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.svc.remove(id);
    return ok(result);
  }
}
