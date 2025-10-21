import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { QueryFavoriteDto } from './dto/query-favorite.dto';

@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly service: FavoritesService) {}

  /** Danh sách yêu thích của tôi */
  @Get()
  findMine(@Req() req: any, @Query() q: QueryFavoriteDto) {
    return this.service.findMine(req.user.id, q);
  }

  /** Thêm yêu thích (idempotent) */
  @Post()
  add(@Req() req: any, @Body() dto: CreateFavoriteDto) {
    return this.service.add(req.user.id, dto);
  }

  /** Toggle yêu thích */
  @Post('toggle')
  toggle(@Req() req: any, @Body() dto: CreateFavoriteDto) {
    return this.service.toggle(req.user.id, dto);
  }

  /** Kiểm tra đã yêu thích chưa */
  @Get(':apartmentId')
  isFavorited(
    @Req() req: any,
    @Param('apartmentId', ParseIntPipe) apartmentId: number
  ) {
    return this.service.isFavorited(req.user.id, apartmentId);
  }

  /** Bỏ yêu thích */
  @Delete(':apartmentId')
  remove(
    @Req() req: any,
    @Param('apartmentId', ParseIntPipe) apartmentId: number
  ) {
    return this.service.remove(req.user.id, apartmentId);
  }
}
