import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class VerifyPhoneDto {
  @ApiProperty({ example: '0987654321' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @ApiProperty({ example: '123456', description: 'Mã OTP nhận qua Zalo/SMS' })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(12)
  code: string;
}
