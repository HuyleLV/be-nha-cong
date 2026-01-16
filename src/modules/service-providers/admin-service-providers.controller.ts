import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ServiceProvidersService } from './service-providers.service';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service-provider.dto';
import { QueryServiceProviderDto } from './dto/query-service-provider.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Service Providers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
// @Roles('admin')
@Controller('admin/service-providers')
export class AdminServiceProvidersController {
    constructor(private readonly service: ServiceProvidersService) { }

    // GET /api/admin/service-providers
    @Get()
    async list(
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('q') q?: string,
        @Query('status') status?: string,
        @Query('approvalStatus') approvalStatus?: string,
        @Query('priority') priority?: string,
    ) {
        const query: any = {
            page: parseInt(String(page), 10) || 1,
            limit: parseInt(String(limit), 10) || 20,
            q,
            status: status as any,
            approvalStatus,
            priority: priority ? parseInt(String(priority), 10) : undefined,
        };
        return this.service.findAll(query);
    }

    // GET /api/admin/service-providers/moderation - Lấy danh sách cần kiểm duyệt
    @Get('moderation')
    async moderationList(
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('approvalStatus') approvalStatus?: string,
    ) {
        const query: any = {
            page: parseInt(String(page), 10) || 1,
            limit: parseInt(String(limit), 10) || 20,
            approvalStatus: approvalStatus || 'pending',
        };
        return this.service.findAll(query);
    }

    // POST /api/admin/service-providers
    @Post()
    async create(@Body() dto: CreateServiceProviderDto) {
        return this.service.create(dto, undefined, 'admin');
    }

    // PATCH /api/admin/service-providers/:id
    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateServiceProviderDto) {
        return this.service.update(Number(id), dto, undefined, 'admin');
    }

    // DELETE /api/admin/service-providers/:id
    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.service.remove(Number(id), undefined, 'admin');
    }

    // PATCH /api/admin/service-providers/:id/approve - Duyệt tin
    @Patch(':id/approve')
    async approve(
        @Param('id') id: string,
        @Body() body: { priority?: number; approvalNote?: string },
    ) {
        return this.service.update(Number(id), {
            approvalStatus: 'approved',
            priority: body.priority,
            approvalNote: body.approvalNote,
            status: 'active' as any,
            isVerified: true,
        } as any, undefined, 'admin');
    }

    // PATCH /api/admin/service-providers/:id/reject - Từ chối
    @Patch(':id/reject')
    async reject(
        @Param('id') id: string,
        @Body() body: { approvalNote?: string },
    ) {
        return this.service.update(Number(id), {
            approvalStatus: 'rejected',
            approvalNote: body.approvalNote,
        } as any, undefined, 'admin');
    }

    // PATCH /api/admin/service-providers/:id/priority - Đặt ưu tiên
    @Patch(':id/priority')
    async setPriority(
        @Param('id') id: string,
        @Body() body: { priority: number },
    ) {
        if (body.priority < -100 || body.priority > 100) {
            throw new Error('Priority must be between -100 and 100');
        }
        return this.service.update(Number(id), {
            priority: body.priority,
        } as any, undefined, 'admin');
    }
}
