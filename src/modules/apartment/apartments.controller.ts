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
    return this.service.findAll(q, user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('discounted')
  async getDiscounted(@Query() q: any, @Req() req: any) {
    // Force discount-related defaults: published + hasDiscount + discount_desc
    const user = req.user;
    try {
      const merged: any = { ...(q || {}), hasDiscount: 'true', sort: 'discount_desc', status: 'published' };
      // Coerce common paging params to numbers to avoid type issues when caller bypasses validation
      merged.page = Number(merged.page) || 1;
      merged.limit = Number(merged.limit) || 10;
      return await this.service.findAll(merged, user);
    } catch (err: any) {
      // Log server error for debugging and return a readable message to client
      // (Keep message generic to avoid leaking internals)
      console.error('GET /apartments/discounted error:', err);
      throw new BadRequestException(err?.message || 'Lỗi khi truy vấn danh sách ưu đãi');
    }
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
      // Helper: convert snake_case DB column name to camelCase form field
      const snakeToCamel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      const extractColumn = (rawMsg: string) => {
        const m1 = rawMsg.match(/for column '([^']+)'/i);
        if (m1 && m1[1]) return m1[1];
        const m2 = rawMsg.match(/column `?([^`'\s]+)`?/i);
        if (m2 && m2[1]) return m2[1];
        return null;
      };
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
        // translate general messages to Vietnamese
        return { message: String(msg) || 'Có lỗi xác thực. Vui lòng kiểm tra dữ liệu.' };
      }

      // 1.5) Common SQL / TypeORM query errors (invalid data types, truncation, null constraints)
      const rawMsg = String(err?.message || err?.sqlMessage || err?.toString() || '').trim();
      const lowerRaw = rawMsg.toLowerCase();
      // Incorrect decimal value / truncated numeric
      if (lowerRaw.includes('incorrect decimal value') || lowerRaw.includes('data truncated') || lowerRaw.includes('truncated') || lowerRaw.includes('invalid decimal')) {
        const col = extractColumn(rawMsg);
        if (col) {
          const field = snakeToCamel(col);
          return { [field]: `Giá trị không hợp lệ cho trường ${field}. Vui lòng nhập số hợp lệ.` };
        }
        return { message: 'Có giá trị không hợp lệ cho một số trường. Vui lòng kiểm tra dữ liệu đầu vào.' };
      }
      // NULL / no default errors
      if (lowerRaw.includes("cannot be null") || lowerRaw.includes("doesn't have a default value") || lowerRaw.includes("cannot be null")) {
        const col = extractColumn(rawMsg);
        if (col) {
          const field = snakeToCamel(col);
          return { [field]: `Trường ${field} không được để trống.` };
        }
        return { message: 'Một trường bắt buộc bị để trống. Vui lòng kiểm tra dữ liệu.' };
      }
      // Foreign key / reference errors
      if (lowerRaw.includes('foreign key') || lowerRaw.includes('a foreign key constraint fails') || lowerRaw.includes('er_no_referenced_row')) {
        return { message: 'Giá trị tham chiếu không hợp lệ hoặc không tồn tại. Vui lòng kiểm tra các trường tham chiếu.' };
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
      // translate fallback to Vietnamese
      return { message: 'Có lỗi xảy ra khi tạo căn hộ. Vui lòng kiểm tra dữ liệu và thử lại.' };
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
