// src/apartments/dto/update-apartment.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateApartmentDto } from './create-apartment.dto';

export class UpdateApartmentDto extends PartialType(CreateApartmentDto) {}