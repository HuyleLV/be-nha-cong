import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { DepositsService } from '../deposits/deposits.service';

@Controller('contracts')
export class ContractsController {
  constructor(
    private readonly svc: ContractsService,
    private readonly depositsService: DepositsService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Query() q: any, @Req() req: any) {
    const ownerId = req.user?.id ?? q.ownerId;
    // Support both 'apartmentId' and legacy 'apartment' query param names
    const apartmentId = q.apartmentId ?? q.apartment ?? undefined;
    const res = await this.svc.findAll({ page: q.page, limit: q.limit, ownerId, status: q.status, apartmentId });
    return { data: res.items, meta: { total: res.total, page: res.page, limit: res.limit } };
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async stats(@Req() req: any) {
    const ownerId = req.user?.id;
    const s = await this.svc.stats(ownerId);
    return { data: s };
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-rental-history')
  async myRentalHistory(@Req() req: any) {
    const customerId = req.user?.id;
    const contracts = await this.svc.findAll({ customerId, limit: 100 });
    const deposits = await this.depositsService.findAll({ customerId, limit: 100 });
    return { data: { contracts: contracts.items, deposits: deposits.items } };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async get(@Param('id') id: string) {
    const r = await this.svc.findOne(Number(id));
    return { data: r };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateContractDto, @Req() req: any) {
    const created = await this.svc.create(dto, req.user?.id);
    return { data: created };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateContractDto) {
    const updated = await this.svc.update(Number(id), dto);
    return { data: updated };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const r = await this.svc.remove(Number(id));
    return { data: r };
  }
}
