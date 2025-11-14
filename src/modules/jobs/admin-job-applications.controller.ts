import { Controller, Get, Query, UseGuards, Param, Patch, Body, Delete } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateJobApplicationDto } from './dto/update-job-application.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/job-applications')
export class AdminJobApplicationsController {
  constructor(private readonly service: JobsService) {}

  // GET /api/admin/job-applications?jobId=&page=&limit=&status=&q=
  @Get()
  async list(@Query('jobId') jobId?: string, @Query('page') page = '1', @Query('limit') limit = '20', @Query('status') status?: string, @Query('q') q?: string) {
    return this.service.listApplications({ jobId: jobId ? Number(jobId) : undefined, page: Number(page)||1, limit: Number(limit)||20, status, q });
  }

  // GET /api/admin/job-applications/counts?jobIds=1,2,3
  @Get('counts')
  async counts(@Query('jobIds') jobIds: string) {
    const ids = (jobIds || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(n => Number(n))
      .filter(n => !isNaN(n));
    return this.service.applicationCounts(ids);
  }

  // GET /api/admin/job-applications/:id
  @Get(':id')
  async getOne(@Param('id') id: string) { return this.service.getApplication(Number(id)); }

  // PATCH /api/admin/job-applications/:id
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateJobApplicationDto) { return this.service.updateApplication(Number(id), dto); }

  // DELETE /api/admin/job-applications/:id
  @Delete(':id')
  async remove(@Param('id') id: string) { return this.service.removeApplication(Number(id)); }
}