import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { AdminJobsController } from './admin-jobs.controller';
import { JobApplication } from './entities/job-application.entity';
import { JobApplicationsController } from './job-applications.controller';
import { AdminJobApplicationsController } from './admin-job-applications.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Job, JobApplication])],
  controllers: [JobsController, AdminJobsController, JobApplicationsController, AdminJobApplicationsController],
  providers: [JobsService],
})
export class JobsModule {}
