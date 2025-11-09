import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/jobs')
export class AdminJobsController {
  constructor(private readonly service: JobsService) {}

  // GET /api/admin/jobs
  @Get()
  async list(@Query('page') page = '1', @Query('limit') limit = '20', @Query('q') q?: string, @Query('status') status?: string) {
    return this.service.findAll({ page: parseInt(String(page),10)||1, limit: parseInt(String(limit),10)||20, q, status });
  }

  // POST /api/admin/jobs
  @Post()
  async create(@Body() dto: CreateJobDto) { return this.service.create(dto); }

  // PATCH /api/admin/jobs/:id
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateJobDto) { return this.service.update(Number(id), dto); }

  // DELETE /api/admin/jobs/:id
  @Delete(':id')
  async remove(@Param('id') id: string) { return this.service.remove(Number(id)); }
}
