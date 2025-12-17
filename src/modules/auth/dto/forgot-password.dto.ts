import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ description: 'Email của tài khoản cần đặt lại mật khẩu' })
  @IsEmail()
  email: string;
}
