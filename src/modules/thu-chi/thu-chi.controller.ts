import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ThuChiService } from './thu-chi.service';
import { CreateThuChiDto } from './dto/create-thu-chi.dto';

@Controller('thu-chi')
export class ThuChiController {
  constructor(private svc: ThuChiService) {}

  @Post()
  create(@Body() dto: CreateThuChiDto) {
    return this.svc.create(dto);
  }

  @Get()
  findAll(@Query() q: any) {
    return this.svc.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.svc.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(Number(id));
  }
}
