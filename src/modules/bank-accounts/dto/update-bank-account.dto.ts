import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBankAccountDto {
  @IsString()
  @IsOptional()
  @MaxLength(160)
  accountHolder?: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  accountNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  bankName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(160)
  branch?: string | null;

  @IsString()
  @IsOptional()
  note?: string | null;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
