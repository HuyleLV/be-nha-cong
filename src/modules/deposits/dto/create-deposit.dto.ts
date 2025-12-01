import { IsEnum, IsInt, IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { DepositStatus } from '../entities/deposit.entity';

export class CreateDepositDto {
  @IsOptional()
  @IsEnum(DepositStatus)
  status?: DepositStatus;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  buildingId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  apartmentId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  customerId?: number;

  @IsOptional()
  @IsString()
  customerInfo?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  occupantsCount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  rentAmount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  depositAmount?: number;

  @IsOptional()
  @IsDateString()
  depositDate?: string;

  @IsOptional()
  @IsDateString()
  moveInDate?: string;

  @IsOptional()
  @IsDateString()
  billingStartDate?: string;

  @IsOptional()
  @IsString()
  contractDuration?: string;

  @IsOptional()
  @IsDateString()
  rentFrom?: string;

  @IsOptional()
  @IsDateString()
  rentTo?: string;

  @IsOptional()
  @IsString()
  paymentCycle?: string;

  @IsOptional()
  @IsString()
  account?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  attachments?: string; // JSON string array
}
