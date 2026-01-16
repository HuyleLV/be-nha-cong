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
    Request,
    Req,
} from '@nestjs/common';
import { ServiceProvidersService } from './service-providers.service';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service-provider.dto';
import { QueryServiceProviderDto } from './dto/query-service-provider.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/roles.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Service Providers')
@Controller('service-providers')
export class ServiceProvidersController {
    constructor(
        private readonly serviceProvidersService: ServiceProvidersService,
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    // @Roles('customer', 'admin')
    create(@Body() createDto: CreateServiceProviderDto, @Request() req: any) {
        return this.serviceProvidersService.create(
            createDto,
            req.user?.id,
            req.user?.role,
        );
    }

    @Get()
    findAll(@Query() query: QueryServiceProviderDto, @Req() req: any) {
        // Parse locationIds from query string (can be comma-separated or array)
        if (query.locationIds && typeof query.locationIds === 'string') {
            query.locationIds = (query.locationIds as string)
                .split(',')
                .map((id) => Number(id.trim()))
                .filter((id) => !isNaN(id));
        }
        return this.serviceProvidersService.findAll(query, req.user);
    }

    @Get(':idOrSlug')
    findOne(@Param('idOrSlug') idOrSlug: string, @Req() req: any) {
        const key = /^\d+$/.test(idOrSlug) ? Number(idOrSlug) : idOrSlug;
        return this.serviceProvidersService.findOne(key, req.user);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    // @Roles('customer', 'admin')
    update(
        @Param('id') id: string,
        @Body() updateDto: UpdateServiceProviderDto,
        @Request() req: any,
    ) {
        const userId = req.user?.id ?? req.user?.sub ?? undefined;
        return this.serviceProvidersService.update(
            Number(id),
            updateDto,
            userId,
            req.user?.role,
        );
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    // @Roles('customer', 'admin')
    remove(@Param('id') id: string, @Request() req: any) {
        const userId = req.user?.id ?? req.user?.sub ?? undefined;
        return this.serviceProvidersService.remove(
            Number(id),
            userId,
            req.user?.role,
        );
    }
}
