import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, IsIn } from 'class-validator';
import { UserRole, CustomerStatus } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ required: false, description: 'Họ tên (tuỳ chọn)', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(160)
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ required: false, description: 'Số điện thoại (tuỳ chọn)', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ enum: ['customer', 'host', 'admin'], default: 'customer' })
  @IsOptional()
  @IsIn(['customer', 'host', 'admin'])
  role?: UserRole;

  @ApiProperty({ required: false, enum: ['viewing','deposit','contract'], description: 'Trạng thái quản lý khách hàng' })
  @IsOptional()
  @IsIn(['new','appointment','sales','deposit_form','contract','failed'])
  customerStatus?: CustomerStatus;

  @ApiProperty({ required: false, description: 'URL ảnh đại diện hoặc key', maxLength: 500 })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ required: false, description: 'URL / key ảnh CCCD mặt trước', maxLength: 500 })
  @IsOptional()
  @IsString()
  idCardFront?: string;

  @ApiProperty({ required: false, description: 'URL / key ảnh CCCD mặt sau', maxLength: 500 })
  @IsOptional()
  @IsString()
  idCardBack?: string;

  @ApiProperty({ required: false, description: 'Số CCCD/CMND' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  idCardNumber?: string;

  @ApiProperty({ required: false, description: 'Địa chỉ' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty({ required: false, description: 'Ngày cấp CCCD/CMND', type: 'string', format: 'date' })
  @IsOptional()
  @IsString()
  idIssueDate?: string;

  @ApiProperty({ required: false, description: 'Nơi cấp CCCD/CMND', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  idIssuePlace?: string;

  @ApiProperty({ required: false, description: 'Ghi chú' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ required: false, description: 'Giới tính', enum: ['male','female','other'] })
  @IsOptional()
  @IsIn(['male','female','other'])
  gender?: string;

  @ApiProperty({ required: false, description: 'Ngày sinh', type: 'string', format: 'date' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;
}
