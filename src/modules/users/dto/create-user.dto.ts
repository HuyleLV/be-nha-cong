import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, IsIn } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  // @ApiProperty()
  // @IsString()
  // @IsNotEmpty()
  // @MaxLength(120)
  // name: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(160)
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ enum: ['customer', 'host', 'admin'], default: 'customer' })
  @IsOptional()
  @IsIn(['customer', 'host', 'admin'])
  role?: UserRole;
}
