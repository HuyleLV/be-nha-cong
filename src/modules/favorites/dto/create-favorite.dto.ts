import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateFavoriteDto {
  @ApiProperty({ example: 123 })
  @IsInt()
  @Min(1)
  apartmentId: number;
}
