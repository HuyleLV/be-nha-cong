import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token đặt lại mật khẩu được gửi qua email' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'Mật khẩu mới', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;

  @ApiProperty({ description: 'Xác nhận mật khẩu mới', minLength: 6 })
  @IsString()
  @MinLength(6)
  confirmNewPassword: string;
}
