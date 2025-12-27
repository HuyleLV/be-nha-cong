import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApartmentsService } from './apartments.service';
import { CreateApartmentDto } from './dto/create-apartment.dto';
import { UpdateApartmentDto } from './dto/update-apartment.dto';
import { QueryApartmentDto } from './dto/query-apartment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Apartments')
@Controller('apartments')
export class ApartmentsController {
  constructor(private readonly service: ApartmentsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Get('available')
  findAvailable(@Query() q: any, @Req() req: any) {
    const user = req.user;
    return this.service.findAvailable(q, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Get('room-status')
  findByRoomStatus(@Query() q: any, @Req() req: any) {
    const user = req.user;
    return this.service.findByRoomStatus(q, user);
  }

  // Public endpoint: apartments that match a roomStatus (e.g. 'sap_trong')
  // Non-auth callers will only receive published and approved apartments (enforced in service)
  @UseGuards(OptionalJwtAuthGuard)
  @Get('room-status/public')
  findByRoomStatusPublic(@Query() q: any, @Req() req: any) {
    const user = req.user;
    return this.service.findByRoomStatus(q, user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(@Query() q: QueryApartmentDto, @Req() req: any) {
    const user = req.user;
    console.log('User in findAll:', user);
    return this.service.findAll(q, user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('home-sections')
  async getHomeSections(
    @Query('citySlug') citySlug: string,
    @Query('limitPerDistrict') limitPerDistrict = 4,
    @Req() req: any,
  ) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined; // tuỳ payload
    return this.service.getHomeSections(citySlug, Number(limitPerDistrict), userId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('most-interested')
  async getMostInterested(
    @Query('limit') limit = 5,
    @Req() req: any,
  ) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    return this.service.getMostInterested(Number(limit), userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Post()
  async create(@Body() dto: CreateApartmentDto, @Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    try {
      const created = await this.service.create(dto, userId, req.user?.role);
      return created;
    } catch (err: any) {
      // Handle common validation/database errors and return structured field errors
      // 1) Known Nest exceptions (BadRequestException, NotFoundException, ForbiddenException)
      const eAny = err as any;
      if (err instanceof BadRequestException || err instanceof NotFoundException || err instanceof ForbiddenException) {
        const msg = eAny?.message || (eAny.getResponse && eAny.getResponse?.() && (eAny.getResponse() as any).message) || String(eAny);
        // Map common messages to field-specific errors
        const lower = String(msg).toLowerCase();
        if (lower.includes('location')) {
          return { locationId: String(msg) };
        }
        if (lower.includes('building')) {
          return { buildingId: String(msg) };
        }
        // Fallback: return message under general key
        return { message: String(msg) };
      }

      // 2) TypeORM duplicate key / constraint errors (MySQL)
      // ER_DUP_ENTRY (1062) → duplicate value (e.g., slug)
      if (err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) {
        const raw = String(err.message || err.sqlMessage || 'Giá trị đã tồn tại');
        // try to extract column name from message
        const m = raw.match(/for key '([^']+)'/i);
        let field = 'slug';
        if (m && m[1]) {
          const key = m[1];
          if (key.toLowerCase().includes('slug')) field = 'slug';
          else if (key.toLowerCase().includes('room_code') || key.toLowerCase().includes('roomcode')) field = 'roomCode';
        }
        return { [field]: 'Giá trị đã tồn tại. Vui lòng kiểm tra và thử lại.' };
      }

      // 3) Fallback: return generic message object so FE can display
      const fallback = (err && (err.message || err.toString())) || 'Có lỗi xảy ra khi tạo căn hộ';
      return { message: String(fallback) };
    }
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string, @Req() req: any) {
    const key = /^\d+$/.test(idOrSlug) ? Number(idOrSlug) : idOrSlug;
    const user = req.user;
    return this.service.findOneByIdOrSlug(key, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateApartmentDto, @Req() req: any) {
    const user = req.user;
    const userId = user?.id ?? user?.sub ?? undefined;
    return this.service.update(Number(id), dto, userId, user?.role);
  }

  // Cập nhật/chỉ định video cho apartment (đặt lên đầu danh sách images)
  @Patch(':id/video')
  updateVideo(@Param('id') id: string, @Body() dto: { videoUrl?: string | null }) {
    return this.service.updateVideo(Number(id), dto?.videoUrl);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('host', 'admin')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const userId = user?.id ?? user?.sub ?? undefined;
    return this.service.remove(Number(id), userId, user?.role);
  }
}
