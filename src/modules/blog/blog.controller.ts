import { Controller, Get, Query, Param, Post, Body, Put, Delete, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { BlogService } from './blog.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ok } from '../../common/utils/response';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    const { items, meta } = await this.blogService.findAll(query);
    return ok(items, meta);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const blog = await this.blogService.findBySlug(slug);
    if (!blog) throw new NotFoundException('Blog not found');
    return ok(blog);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.blogService.findOne(id);
    return ok(user);
  }

  @Post()
  async create(@Body() dto: CreateBlogDto) {
    const created = await this.blogService.create(dto);
    return ok(created);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBlogDto) {
    const updated = await this.blogService.update(id, dto);
    return ok(updated);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.blogService.remove(id);
    return ok(result);
  }
}
