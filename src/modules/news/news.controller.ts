import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Controller('news')
export class NewsController {
  constructor(private readonly service: NewsService) {}

  @Get()
  async findAll(@Query() query) {
    return this.service.findAll(query);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Post()
  async create(@Body() dto: CreateNewsDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateNewsDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
