import { IsInt, IsOptional, IsString, IsEmail, IsDateString, Length } from 'class-validator';

export class CreateViewingDto {
  @IsInt()
  apartmentId: number;

  // Nếu user đã đăng nhập, backend sẽ tự gán userId từ req.user
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(6, 30)
  phone?: string;

  @IsDateString()
  preferredAt: string; // ISO string

  @IsOptional()
  @IsString()
  note?: string;
}
