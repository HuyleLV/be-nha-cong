import { IsString, IsOptional, Length, IsInt, Min, IsEnum } from 'class-validator';
import { JobStatus } from '../entities/job.entity';

export class CreateJobDto {
  @IsString() @Length(3,200)
  title!: string;

  @IsOptional() @IsString() @Length(3,200)
  slug?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  requirements?: string;

  @IsOptional() @IsString()
  benefits?: string;

  @IsOptional() @IsString() @Length(2,120)
  location?: string;

  @IsOptional() @IsString() @Length(2,60)
  employmentType?: string;

  @IsOptional() @IsString() @Length(2,60)
  level?: string;

  @IsOptional() @IsInt() @Min(0)
  salaryMin?: number;

  @IsOptional() @IsInt() @Min(0)
  salaryMax?: number;

  @IsOptional() @IsString() @Length(1,10)
  currency?: string;

  @IsOptional() @IsEnum(['draft','published','archived'])
  status?: JobStatus;
}
