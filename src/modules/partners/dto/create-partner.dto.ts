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
    need?: string;
  }
  