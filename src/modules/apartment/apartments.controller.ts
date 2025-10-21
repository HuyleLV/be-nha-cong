import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApartmentsService } from './apartments.service';
import { CreateApartmentDto } from './dto/create-apartment.dto';
import { UpdateApartmentDto } from './dto/update-apartment.dto';
import { QueryApartmentDto } from './dto/query-apartment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('Apartments')
@Controller('apartments')
export class ApartmentsController {
  constructor(private readonly service: ApartmentsService) {}

  @Get()
  findAll(@Query() q: QueryApartmentDto) {
    return this.service.findAll(q);
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

  @Post()
  create(@Body() dto: CreateApartmentDto) {
    return this.service.create(dto /*, req.user?.id */);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string, @Req() req: any) {
    const key = /^\d+$/.test(idOrSlug) ? Number(idOrSlug) : idOrSlug;
    const userId = req.user?.id ?? req.user?.sub ?? undefined; // tuỳ payload
    return this.service.findOneByIdOrSlug(key, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateApartmentDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
