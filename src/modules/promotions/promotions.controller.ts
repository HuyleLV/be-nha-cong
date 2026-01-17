import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Promotions')
@Controller('promotions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PromotionsController {
    constructor(private readonly service: PromotionsService) { }

    @Post()
    @Roles('admin', 'host')
    create(@Body() body: any, @Req() req: any) {
        const userId = req.user.id ?? req.user.sub;
        return this.service.create(body, userId);
    }

    @Get()
    @Roles('admin', 'host')
    findAll() {
        return this.service.findAll(false);
    }

    // Endpoint for residents to list available public promos? 
    @Get('active')
    @Roles('user', 'customer', 'resident')
    findActive() {
        return this.service.findAll(true);
    }

    @Post('check')
    @Roles('user', 'customer', 'resident', 'host', 'admin')
    async check(@Body('code') code: string) {
        const promo = await this.service.checkValidity(code);
        return { valid: true, promo };
    }
}
