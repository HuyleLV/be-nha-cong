import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { OwnershipRole } from '../entities/ownership.entity';

export class CreateOwnershipDto {
  @ApiProperty() @IsInt() @IsNotEmpty()
  userId: number;

  @ApiProperty() @IsInt() @IsNotEmpty()
  buildingId: number;

  @ApiProperty({ enum: ['owner','manager','editor','viewer'], default: 'owner' })
  @IsEnum(['owner','manager','editor','viewer'])
  role: OwnershipRole = 'owner';
}
