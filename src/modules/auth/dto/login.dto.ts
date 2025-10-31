import { IsString } from 'class-validator';

export class LoginDto {
  // Cho phép nhập email hoặc số điện thoại
  @IsString()
  identifier: string;

  @IsString()
  password_hash: string;
}
