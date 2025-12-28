import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { QueryReportDto } from './dto/query-report.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  // Allow authenticated or anonymous users to create: use OptionalJwt so we can capture user id if present
  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  create(@Body() dto: CreateReportDto, @Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    return this.service.create(dto, userId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(@Query() q: QueryReportDto, @Req() req: any) {
    const user = req.user;
    return this.service.findAll(q, user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    return this.service.findOne(Number(id), user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReportDto, @Req() req: any) {
    const user = req.user;
    const userId = user?.id ?? user?.sub ?? undefined;
    return this.service.update(Number(id), dto, userId, user?.role);
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
