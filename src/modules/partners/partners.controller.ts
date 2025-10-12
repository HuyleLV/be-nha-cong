// src/partners/partners.controller.ts
import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    Param,
    Delete,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import { PartnersService } from './partners.service';
  import { CreatePartnerDto } from './dto/create-partner.dto';
  
  type Role = 'landlord' | 'customer' | 'operator';
  
  @Controller('partners')
  export class PartnersController {
    constructor(private readonly service: PartnersService) {}
  
    @Get()
    async findAll(
      @Query('page') page?: string,
      @Query('limit') limit?: string,
      @Query('role') role?: Role,
      @Query('q') q?: string,
    ) {
      const res = await this.service.findAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        role,
        q,
      });
  
      const totalPages = Math.max(
        1,
        Math.ceil((res.total ?? 0) / (res.limit ?? 1)),
      );
  
      return {
        ok: true,
        data: res.items,
        meta: {
          page: res.page,
          limit: res.limit,
          total: res.total,
          totalPages,
        },
      };
    }
  
    @Get(':id')
    async findOne(@Param('id') id: string) {
      const lead = await this.service.findOne(+id);
      return { ok: true, data: lead };
    }
  
    @Post()
    async create(@Body() dto: CreatePartnerDto) {
      const lead = await this.service.create(dto);
      return { ok: true, data: lead };
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
      await this.service.remove(+id);
    }
  }
  