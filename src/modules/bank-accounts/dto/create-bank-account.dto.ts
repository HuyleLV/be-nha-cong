import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBankAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  accountHolder!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  accountNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  bankName!: string;

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
