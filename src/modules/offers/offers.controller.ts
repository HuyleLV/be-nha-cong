import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Offers')
@Controller('offers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OffersController {
    constructor(private readonly service: OffersService) { }

    @Post()
    @Roles('admin', 'host')
    create(@Body() body: any, @Req() req: any) {
        const userId = req.user.id ?? req.user.sub;
        return this.service.create(body, userId);
    }

    @Put(':id')
    @Roles('admin', 'host')
    update(@Param('id') id: number, @Body() body: any) {
        return this.service.update(id, body);
    }

    @Delete(':id')
    @Roles('admin', 'host')
    remove(@Param('id') id: number) {
        return this.service.remove(id);
    }

    @Get()
    @Roles('admin', 'host')
    findAll() {
        return this.service.findAll(false);
    }

    @Get('active')
    @Roles('user', 'customer', 'resident')
    findActive() {
        return this.service.findAll(true);
    }

    @Get(':id')
    @Roles('user', 'customer', 'resident', 'admin', 'host')
    findOne(@Param('id') id: number) {
        return this.service.findOne(id);
    }
}
