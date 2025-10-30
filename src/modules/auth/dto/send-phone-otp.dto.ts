import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendPhoneOtpDto {
  @ApiProperty({ example: '0987654321', description: 'Số điện thoại cần xác minh' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;
}
