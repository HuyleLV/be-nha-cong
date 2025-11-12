import { Body, Controller, Param, Post } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobApplicationDto } from './dto/create-job-application.dto';

@Controller('jobs')
export class JobApplicationsController {
  constructor(private readonly service: JobsService) {}

  // Public: POST /api/jobs/:idOrSlug/apply
  @Post(':idOrSlug/apply')
  async apply(@Param('idOrSlug') idOrSlug: string, @Body() body: Omit<CreateJobApplicationDto, 'jobId'>) {
    const jobKey = /^\d+$/.test(idOrSlug) ? Number(idOrSlug) : idOrSlug;
    return this.service.createApplication(jobKey, body);
  }
}
