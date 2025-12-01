import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehicleDto } from './dto/query-vehicle.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly svc: VehiclesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Post()
  create(@Body() dto: CreateVehicleDto, @Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    return this.svc.create(dto, userId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(@Query() q: QueryVehicleDto, @Req() req: any) {
    const user = req.user;
    return this.svc.findAll(q, user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(Number(id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto, @Req() req: any) {
    const user = req.user;
    const userId = user?.id ?? user?.sub ?? undefined;
    return this.svc.update(Number(id), dto, userId, user?.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const userId = user?.id ?? user?.sub ?? undefined;
    return this.svc.remove(Number(id), userId, user?.role);
  }
}
