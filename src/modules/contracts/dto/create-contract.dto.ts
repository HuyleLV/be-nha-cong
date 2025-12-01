import { IsNotEmpty, IsOptional, IsInt, IsNumberString, IsEnum, IsArray, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ContractStatus } from '../entities/contract.entity';

export class CreateContractDto {
  @IsOptional()
  @IsInt()
  buildingId?: number;

  @IsOptional()
  @IsInt()
  apartmentId?: number;

  @IsOptional()
  @IsDateString()
  signDate?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  invoiceTemplate?: string;

  @IsOptional()
  note?: string;

  @IsOptional()
  @IsInt()
  customerId?: number;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined ? value : String(value)))
  @IsNumberString()
  rentAmount?: string;

  @IsOptional()
  paymentCycle?: string;

  @IsOptional()
  @IsDateString()
  billingStartDate?: string;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined ? value : String(value)))
  @IsNumberString()
  depositAmount?: string;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined ? value : String(value)))
  @IsNumberString()
  depositPaid?: string;

  @IsOptional()
  @IsArray()
  attachments?: string[];

  @IsOptional()
  @IsArray()
  serviceFees?: any[];

  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;
}
