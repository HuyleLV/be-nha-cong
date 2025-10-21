import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OwnershipsService } from './ownership.service';
import { CreateOwnershipDto } from './dto/create-ownership.dto';
import { UpdateOwnershipDto } from './dto/update-ownership.dto';
import { QueryOwnershipDto } from './dto/query-ownership.dto';

@ApiTags('Ownerships')
@Controller('ownerships')
export class OwnershipsController {
  constructor(private readonly service: OwnershipsService) {}

    @Get()
    findAll(@Query() q: QueryOwnershipDto) {
        return this.service.findAll(q);
    }

    @Post()
    create(@Body() dto: CreateOwnershipDto) {
        return this.service.create(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateOwnershipDto) {
        return this.service.update(Number(id), dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(Number(id));
    }
}
