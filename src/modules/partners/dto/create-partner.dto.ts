// src/partners/dto/create-partner.dto.ts
import {
    IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, MaxLength, ValidateIf,
  } from 'class-validator';
  import { Type, Transform } from 'class-transformer';
  
  export class CreatePartnerDto {
    @IsEnum(['landlord','customer','operator'])
    role: 'landlord' | 'customer' | 'operator';
  
    @IsString() @MaxLength(180) @IsNotEmpty()
    fullName: string;
  
    @IsString() @MaxLength(60) @IsNotEmpty()
    phone: string;
  
    @IsEmail() @MaxLength(180)
    email: string;
  
    @IsOptional() @IsString()
    note?: string;
  
    /* Landlord: propertyCount là số nguyên >= 1 */
    @ValidateIf(o => o.role === 'landlord')
    @Type(() => Number)              // <-- ép chuỗi sang number
    @Transform(({ value }) => value === '' ? undefined : value) // trống -> undefined để không lỗi
    @IsInt()
    @Min(1)
    propertyCount?: number;
  
    /* Customer: budget là số nguyên >= 0 */
    @ValidateIf(o => o.role === 'customer')
    @Type(() => Number)
    @Transform(({ value }) => value === '' ? undefined : value)
    @IsInt()
    @Min(0)
    budget?: number;
  
    /* Operator: companyName bắt buộc */
    @ValidateIf(o => o.role === 'operator')
    @IsString() @MaxLength(200) @IsNotEmpty()
    companyName?: string;
  }
  