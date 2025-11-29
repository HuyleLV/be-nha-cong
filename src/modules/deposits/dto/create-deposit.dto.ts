import { IsEnum, IsInt, IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { DepositStatus } from '../entities/deposit.entity';

export class CreateDepositDto {
  @IsOptional()
  @IsEnum(DepositStatus)
  status?: DepositStatus;

  @IsOptional()
  @IsInt()
  buildingId?: number;

  @IsOptional()
  @IsInt()
  apartmentId?: number;

  @IsOptional()
  @IsInt()
  customerId?: number;

  @IsOptional()
  @IsString()
  customerInfo?: string;

  @IsOptional()
  @IsInt()
  occupantsCount?: number;

  @IsOptional()
  @IsNumber()
  rentAmount?: number;

  @IsOptional()
  @IsNumber()
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
