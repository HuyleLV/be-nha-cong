import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { BankAccountsService } from './bank-accounts.service';
import { QueryBankAccountDto } from './dto/query-bank-account.dto';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@Controller('bank-accounts')
export class BankAccountsController {
  constructor(private readonly svc: BankAccountsService) {}

  // Host: list my bank accounts
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Get('host')
  async hostList(@Query() q: QueryBankAccountDto, @Req() req: any) {
    const userId = req?.user?.id ?? req?.user?.sub;
    return this.svc.hostList(Number(userId), q);
  }

  // Host: get one
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Get('host/:id')
  async hostGetOne(@Param('id') id: string, @Req() req: any) {
    const userId = req?.user?.id ?? req?.user?.sub;
    return this.svc.hostGetOne(Number(id), Number(userId));
  }

  // Host: create
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Post('host')
  async hostCreate(@Body() dto: CreateBankAccountDto, @Req() req: any) {
    const userId = req?.user?.id ?? req?.user?.sub;
    return this.svc.hostCreate(dto, Number(userId));
  }

  // Host: update
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Patch('host/:id')
  async hostUpdate(@Param('id') id: string, @Body() dto: UpdateBankAccountDto, @Req() req: any) {
    const userId = req?.user?.id ?? req?.user?.sub;
    return this.svc.hostUpdate(Number(id), dto, Number(userId));
  }

  // Host: delete
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Delete('host/:id')
  async hostDelete(@Param('id') id: string, @Req() req: any) {
    const userId = req?.user?.id ?? req?.user?.sub;
    return this.svc.hostDelete(Number(id), Number(userId));
  }

  // Host: balances for accounts
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Get('host/balances')
  async hostBalances(@Req() req: any) {
    const userId = req?.user?.id ?? req?.user?.sub;
    return this.svc.hostBalances(Number(userId));
  }

  // Host: daily cashbook report
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Get('host/daily-cashbook')
  async hostDailyCashbook(@Req() req: any, @Query() q: any) {
    const userId = req?.user?.id ?? req?.user?.sub;
    const start = q?.start ?? q?.from;
    const end = q?.end ?? q?.to;
    return this.svc.hostDailyCashbook(Number(userId), String(start), String(end));
  }
}
