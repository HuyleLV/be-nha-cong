import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateCtvRequestDto {
  @IsOptional()
  userId?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
