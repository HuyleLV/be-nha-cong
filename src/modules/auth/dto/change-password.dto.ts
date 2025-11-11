import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, ValidateIf } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Mật khẩu hiện tại', minLength: 6 })
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @ApiProperty({ description: 'Mật khẩu mới', minLength: 6 })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  newPassword: string;

  @ApiProperty({ description: 'Xác nhận mật khẩu mới', minLength: 6 })
  @IsString()
  @MinLength(6)
  confirmNewPassword: string;
}