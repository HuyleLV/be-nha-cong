import { IsNotEmpty, IsOptional, IsString, IsEnum, IsDateString, IsInt } from 'class-validator';
import { PriorityLevel } from '../entities/task.entity';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsInt()
  buildingId: number;

  @IsNotEmpty()
  @IsInt()
  apartmentId: number;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  group?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsEnum(PriorityLevel)
  priority?: PriorityLevel;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  assignee?: string;

  @IsOptional()
  @IsString()
  attachments?: string;
}
