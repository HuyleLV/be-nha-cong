import { Controller, Get, Query, Param, Post, Body, Patch, Delete, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ok } from '../../common/utils/response';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('admin', 'host')
  async findAll(@Req() req: any, @Query() query: any) {
    const { items, meta } = await this.usersService.findAll(query, req.user);
    return ok(items, meta);
  }

  @Get(':id')
  @Roles('admin', 'host')
  async findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id, req.user);
    return ok(user);
  }

  @Post()
  @Roles('admin', 'host')
  async create(@Req() req: any, @Body() dto: CreateUserDto) {
    const created = await this.usersService.create(dto, req.user);
    return ok(created);
  }

  @Patch(':id')
  @Roles('admin','host')
  async update(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    const updated = await this.usersService.update(id, dto, req.user);
    return ok(updated);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.usersService.remove(id);
    return ok(result);
  }
}
