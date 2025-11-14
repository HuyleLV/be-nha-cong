import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateJobApplicationDto {
  @IsOptional() @IsString() @Length(3,20)
  status?: string;

  @IsOptional() @IsString()
  internalNote?: string | null;
}