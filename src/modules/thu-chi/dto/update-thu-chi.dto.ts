import { PartialType } from '@nestjs/mapped-types';
import { CreateThuChiDto } from './create-thu-chi.dto';

export class UpdateThuChiDto extends PartialType(CreateThuChiDto) {}
