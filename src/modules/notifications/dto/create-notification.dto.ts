import { IsIn, IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  attachments?: string;

  @IsOptional()
  @IsIn(['building','apartment'])
  recipientType?: 'building' | 'apartment';

  @IsOptional()
  @Type(()=> Number)
  @IsInt()
  buildingId?: number;

  @IsOptional()
  @Type(()=> Number)
  @IsInt()
  apartmentId?: number;
}
