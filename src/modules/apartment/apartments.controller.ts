// src/apartments/apartments.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, Req, UseGuards, Put } from '@nestjs/common';
import { Request } from 'express';
import { ApartmentsService } from './apartments.service';
import { CreateApartmentDto } from './dto/create-apartment.dto';
import { UpdateApartmentDto } from './dto/update-apartment.dto';
import { QueryApartmentDto } from './dto/query-apartment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('apartments')
export class ApartmentsController {
  constructor(private readonly service: ApartmentsService) {}

  @Get()
  findAll(@Query() q: QueryApartmentDto) {
    return this.service.findAll(q);
  }

  @Get('home-sections')
  getHomeSections(
    @Query('citySlug') citySlug: string,
    @Query('limitPerDistrict') limitPerDistrict?: number,
  ) {
    return this.service.getHomeSections(citySlug, limitPerDistrict);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateApartmentDto, @Req() req: Request) {
    const userId = (req as any)?.user?.id; 
    return this.service.create(dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateApartmentDto) {
    return this.service.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}