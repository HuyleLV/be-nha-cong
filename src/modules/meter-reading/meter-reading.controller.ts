import { Controller, Post, Body, UseGuards, Req, Get, Param, Patch, InternalServerErrorException, Query, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MeterReadingService } from './meter-reading.service';
import { CreateMeterReadingDto } from './dto/create-meter-reading.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('MeterReadings')
@Controller('meter-readings')
export class MeterReadingController {
  constructor(private readonly service: MeterReadingService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Post()
  async create(@Body() dto: CreateMeterReadingDto, @Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    try {
      console.log('[MeterReadingController.create] userId=', userId, 'payload=', JSON.stringify(dto));
      return await this.service.create(dto, userId);
    } catch (err) {
      console.error('[MeterReadingController.create] error', err);
      throw new InternalServerErrorException(err?.message || 'Lỗi khi tạo ghi chỉ số');
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: CreateMeterReadingDto, @Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    try {
      console.log('[MeterReadingController.update] id=', id, 'userId=', userId, 'payload=', JSON.stringify(dto));
      const out = await this.service.update(Number(id), dto, userId);
      console.log('[MeterReadingController.update] result=', JSON.stringify(out));
      return out;
    } catch (err) {
      console.error('[MeterReadingController.update] error', err);
      throw new InternalServerErrorException(err?.message || 'Lỗi khi cập nhật ghi chỉ số');
    }
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Get()
  list(@Req() req: any, @Query() q: any) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    return this.service.findAllByUser(userId, q);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Get('stats')
  async stats(@Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    try {
      return await this.service.getStatsByUser(userId);
    } catch (err) {
      console.error('[MeterReadingController.stats] error', err);
      throw new InternalServerErrorException(err?.message || 'Lỗi khi lấy thống kê ghi chỉ số');
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Patch(':id/approve')
  async approve(@Param('id') id: string, @Req() req: any, @Body() body: any) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    const approve = typeof body?.approve === 'boolean' ? body.approve : true;
    try {
      return await this.service.setApproval(Number(id), userId, approve);
    } catch (err) {
      console.error('[MeterReadingController.approve] error', err);
      throw new InternalServerErrorException(err?.message || 'Lỗi khi cập nhật trạng thái duyệt');
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Get(':id')
  getOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    return this.service.findOne(Number(id), userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Get('latest/by-apartment')
  latestByApartment(
    @Query('apartmentId') apartmentId: string,
    @Query('meterType') meterType: 'electricity' | 'water',
    @Req() req: any,
  ) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    return this.service.findLatest(Number(apartmentId), meterType, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    try {
      await this.service.remove(Number(id), userId);
      return { deleted: true };
    } catch (err) {
      console.error('[MeterReadingController.remove] error', err);
      throw new InternalServerErrorException(err?.message || 'Xoá ghi chỉ số thất bại');
    }
  }
}
