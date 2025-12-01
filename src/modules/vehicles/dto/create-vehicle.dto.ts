import { IsOptional, IsString, IsInt, IsNumberString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateVehicleDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  plateNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ticketNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  buildingId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  apartmentId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  customerId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  photo?: string;
}
