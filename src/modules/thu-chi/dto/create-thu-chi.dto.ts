import { IsArray, IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ThuChiItemDto {
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  amount?: string | null;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;
}

export class CreateThuChiDto {
  @IsIn(['thu','chi'])
  type: 'thu' | 'chi';

  @IsOptional()
  @IsNumber()
  buildingId?: number | null;

  @IsOptional()
  @IsNumber()
  apartmentId?: number | null;

  @IsOptional()
  @IsNumber()
  contractId?: number | null;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  payerName?: string | null;

  @IsOptional()
  @IsString()
  account?: string | null;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  note?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ThuChiItemDto)
  items: ThuChiItemDto[];
}
