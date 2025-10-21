import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { ViewingStatus } from '../entities/viewing.entity';

export class UpdateViewingStatusDto {
  @IsIn(['pending', 'confirmed', 'cancelled'])
  status: ViewingStatus;

  @IsOptional()
  @IsString()
  staffNote?: string;
}
