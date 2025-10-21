import { PartialType } from '@nestjs/swagger';
import { CreateOwnershipDto } from './create-ownership.dto';

export class UpdateOwnershipDto extends PartialType(CreateOwnershipDto) {}