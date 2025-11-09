import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('jobs')
export class JobsController {
  constructor(private readonly service: JobsService) {}

  // Public list
  @Get()
  async list(@Query('page') page = '1', @Query('limit') limit = '20', @Query('q') q?: string) {
    return this.service.findAll({ page: parseInt(String(page),10)||1, limit: parseInt(String(limit),10)||20, q, status: 'published' });
  }

  // Public detail
  @Get(':idOrSlug')
  async getOne(@Param('idOrSlug') idOrSlug: string) {
    const key = /^\d+$/.test(idOrSlug) ? Number(idOrSlug) : idOrSlug;
    return this.service.findOne(key);
  }

  // Admin list
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/all')
  async adminList(@Query() q: any) {
    return this.service.findAll({ page: Number(q.page)||1, limit: Number(q.limit)||20, q: q.q, status: q.status });
  }

  // Admin create
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin')
  async create(@Body() dto: CreateJobDto) { return this.service.create(dto); }

  // Admin update
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateJobDto) { return this.service.update(Number(id), dto); }

  // Admin delete
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/:id')
  async remove(@Param('id') id: string) { return this.service.remove(Number(id)); }
}
