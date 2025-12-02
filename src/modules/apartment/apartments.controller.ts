import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApartmentsService } from './apartments.service';
import { CreateApartmentDto } from './dto/create-apartment.dto';
import { UpdateApartmentDto } from './dto/update-apartment.dto';
import { QueryApartmentDto } from './dto/query-apartment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Apartments')
@Controller('apartments')
export class ApartmentsController {
  constructor(private readonly service: ApartmentsService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(@Query() q: QueryApartmentDto, @Req() req: any) {
    const user = req.user;
    console.log('User in findAll:', user);
    return this.service.findAll(q, user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('home-sections')
  async getHomeSections(
    @Query('citySlug') citySlug: string,
    @Query('limitPerDistrict') limitPerDistrict = 4,
    @Req() req: any,
  ) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined; // tuỳ payload
    return this.service.getHomeSections(citySlug, Number(limitPerDistrict), userId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('most-interested')
  async getMostInterested(
    @Query('limit') limit = 5,
    @Req() req: any,
  ) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    return this.service.getMostInterested(Number(limit), userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Post()
  create(@Body() dto: CreateApartmentDto, @Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    return this.service.create(dto, userId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string, @Req() req: any) {
    const key = /^\d+$/.test(idOrSlug) ? Number(idOrSlug) : idOrSlug;
    const user = req.user;
    return this.service.findOneByIdOrSlug(key, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateApartmentDto, @Req() req: any) {
    const user = req.user;
    const userId = user?.id ?? user?.sub ?? undefined;
    return this.service.update(Number(id), dto, userId, user?.role);
  }

  // Cập nhật/chỉ định video cho apartment (đặt lên đầu danh sách images)
  @Patch(':id/video')
  updateVideo(@Param('id') id: string, @Body() dto: { videoUrl?: string | null }) {
    return this.service.updateVideo(Number(id), dto?.videoUrl);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const userId = user?.id ?? user?.sub ?? undefined;
    return this.service.remove(Number(id), userId, user?.role);
  }
}
