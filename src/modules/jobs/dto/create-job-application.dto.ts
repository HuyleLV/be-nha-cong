import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateJobApplicationDto {
  @IsInt() @Min(1)
  jobId!: number;

  @IsString() @Length(2,150)
  name!: string;

  @IsOptional() @IsString() @Length(5,150)
  email?: string;

  @IsOptional() @IsString() @Length(6,30)
  phone?: string;

  @IsOptional() @IsString() @Length(1,500)
  cvUrl?: string;

  @IsOptional() @IsString()
  message?: string;
}
