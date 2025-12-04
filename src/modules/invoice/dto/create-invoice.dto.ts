import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';

export class CreateInvoiceItemDto {
  @IsString()
  serviceName: string;

  @IsOptional()
  @IsString()
  unitPrice?: string | null;

  @IsOptional()
  @IsString()
  meterIndex?: string | null;

  @IsOptional()
  @IsString()
  quantity?: string | null;

  @IsOptional()
  @IsString()
  vat?: string | null;

  @IsOptional()
  @IsString()
  fromDate?: string | null; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  toDate?: string | null; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  amount?: string | null;
}

export class CreateInvoiceDto {
  @Type(() => Number)
  @IsInt()
  buildingId: number;

  @Type(() => Number)
  @IsInt()
  apartmentId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  contractId?: number | null;

  @IsString()
  period: string; // YYYY-MM

  @IsOptional()
  @IsString()
  issueDate?: string | null; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  dueDate?: string | null; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  printTemplate?: string | null;

  @IsOptional()
  @IsString()
  note?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
