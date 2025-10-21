import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BuildingService } from './building.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { QueryBuildingDto } from './dto/query-building.dto';

@ApiTags('Buildings')
@Controller('buildings')
export class BuildingController {
  constructor(private readonly service: BuildingService) {}

  @Post()
  create(@Body() dto: CreateBuildingDto) {
    return this.service.create(dto /*, req.user?.id */);
  }

  @Get()
  findAll(@Query() q: QueryBuildingDto) {
    return this.service.findAll(q);
  }

  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string) {
    const key = /^\d+$/.test(idOrSlug) ? Number(idOrSlug) : idOrSlug;
    return this.service.findOneByIdOrSlug(key);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBuildingDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
