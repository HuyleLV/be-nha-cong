import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateInvoiceItemDto } from './create-invoice.dto';

export class UpdateInvoiceDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  buildingId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  apartmentId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  contractId?: number | null;

  @IsOptional()
  @IsString()
  period?: string; // YYYY-MM

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items?: CreateInvoiceItemDto[];
}
