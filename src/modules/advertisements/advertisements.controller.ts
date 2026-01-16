import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdvertisementsService } from './advertisements.service';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';
import { QueryAdvertisementDto } from './dto/query-advertisement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard'; // Commented out if not available
// import { Roles } from '../auth/roles.decorator'; // Commented out if not available

@ApiTags('Advertisements')
@Controller('advertisements')
export class AdvertisementsController {
    constructor(private readonly service: AdvertisementsService) { }

    // Public: Get ads by position
    @Get()
    findAll(@Query() query: QueryAdvertisementDto) {
        // Public view: chỉ lấy active ads
        return this.service.findAll({ ...query, activeOnly: true }, true);
    }

    // Public: Track click
    @Post(':id/click')
    async trackClick(@Param('id') id: string) {
        return this.service.trackClick(Number(id));
    }

    // Public: Track view
    @Post(':id/view')
    async trackView(@Param('id') id: string) {
        return this.service.trackView(Number(id));
    }

    // Admin endpoints - Simplified for now
    @UseGuards(JwtAuthGuard)
    // @Roles('admin')
    @Get('admin/all')
    async adminFindAll(@Query() query: QueryAdvertisementDto) {
        return this.service.findAll(query, false);
    }

    @UseGuards(JwtAuthGuard)
    // @Roles('admin')
    @Get('admin/:id')
    async adminFindOne(@Param('id') id: string) {
        return this.service.findOne(Number(id));
    }

    @UseGuards(JwtAuthGuard)
    // @Roles('admin')
    @Post('admin')
    async adminCreate(@Body() dto: CreateAdvertisementDto, @Req() req: any) {
        const userId = req.user?.id ?? req.user?.sub ?? undefined;
        return this.service.create(dto, userId);
    }

    @UseGuards(JwtAuthGuard)
    // @Roles('admin')
    @Patch('admin/:id')
    async adminUpdate(
        @Param('id') id: string,
        @Body() dto: UpdateAdvertisementDto,
    ) {
        return this.service.update(Number(id), dto);
    }

    @UseGuards(JwtAuthGuard)
    // @Roles('admin')
    @Delete('admin/:id')
    async adminRemove(@Param('id') id: string) {
        return this.service.remove(Number(id));
    }

    @UseGuards(JwtAuthGuard)
    // @Roles('admin')
    @Patch('admin/:id/priority')
    async adminUpdatePriority(
        @Param('id') id: string,
        @Body() body: { priority: number },
    ) {
        return this.service.updatePriority(Number(id), body.priority);
    }

    @UseGuards(JwtAuthGuard)
    // @Roles('admin')
    @Patch('admin/:id/status')
    async adminUpdateStatus(
        @Param('id') id: string,
        @Body() body: { status: 'active' | 'inactive' },
    ) {
        return this.service.updateStatus(Number(id), body.status);
    }
}
