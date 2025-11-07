// src/viewings/viewings.controller.ts
import { Body, Controller, Get, Post, Query, UseGuards, Req, Patch, Param, Delete } from '@nestjs/common';
import { ViewingsService } from './viewings.service';
import { CreateViewingDto } from './dto/create-viewing.dto';
import { QueryViewingDto } from './dto/query-viewing.dto';
import { UpdateViewingStatusDto } from './dto/update-viewing-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

class RecordViewDto {
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  apartmentId!: number;
}

@Controller('viewings')
export class ViewingsController {
  constructor(private readonly svc: ViewingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateViewingDto, @Req() req: any) {
    const userId = req?.user?.id ?? req?.user?.sub; // lấy userId từ token
    return this.svc.create(dto, userId);
  }

  /** Người dùng: xem các yêu cầu của mình */
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  async mine(@Query() q: QueryViewingDto, @Req() req: any) {
    const userId = req?.user?.id ?? req?.user?.sub;
    return this.svc.findMine(userId, q);
  }

  /** Admin: list/filter */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin')
  async adminList(@Query() q: QueryViewingDto) {
    return this.svc.adminFindAll(q);
  }

  /** Admin: get detail */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/:id')
  async adminGetOne(@Param('id') id: string) {
    return this.svc.adminFindOne(Number(id));
  }

  /** Admin: cập nhật trạng thái */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/:id/status')
  async adminUpdateStatus(
    @Param('id') id: string, 
    @Body() dto: UpdateViewingStatusDto,
    @Req() req: any
  ) {
    const adminId = req?.user?.id ?? req?.user?.sub;
    return this.svc.adminUpdateStatus(Number(id), dto, adminId);
  }

  /** Admin: xoá yêu cầu */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/:id')
  async adminRemove(@Param('id') id: string) {
    return this.svc.adminRemove(Number(id));
  }

  /* ========= Recently viewed (history) ========= */

  @UseGuards(JwtAuthGuard)
  @Post('visit')
  async recordVisit(@Body() body: RecordViewDto, @Req() req: any) {
    const userId = req?.user?.id ?? req?.user?.sub;
    return this.svc.recordView(body.apartmentId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('recent')
  async recent(@Query('page') page = '1', @Query('limit') limit = '20', @Req() req: any) {
    const userId = req?.user?.id ?? req?.user?.sub;
    const p = parseInt(String(page), 10) || 1;
    const l = Math.min(50, parseInt(String(limit), 10) || 20);
    return this.svc.recentViews(userId, p, l);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('recent')
  async clearRecent(@Req() req: any) {
    const userId = req?.user?.id ?? req?.user?.sub;
    return this.svc.clearRecent(userId);
  }

  /** Các phòng đã xem (đã được admin đánh dấu done) */
  @UseGuards(JwtAuthGuard)
  @Get('visited')
  async visited(@Query('page') page = '1', @Query('limit') limit = '20', @Req() req: any) {
    const userId = req?.user?.id ?? req?.user?.sub;
    const p = parseInt(String(page), 10) || 1;
    const l = Math.min(50, parseInt(String(limit), 10) || 20);
    return this.svc.visitedApartments(userId, p, l);
  }
}
