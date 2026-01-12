import { Body, Controller, Post, UseGuards, Req, Get, Param, Patch } from '@nestjs/common';
import { CtvRequestsService } from './ctv-requests.service';
import { CreateCtvRequestDto } from './dto/create-ctv-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('ctv/requests')
export class CtvRequestsController {
  constructor(private readonly svc: CtvRequestsService) {}

  // Any authenticated user can create a request
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateCtvRequestDto, @Req() req: any) {
    const user = req?.user;
    return this.svc.create(dto, user);
  }
}

@Controller('admin/ctv-requests')
export class AdminCtvRequestsController {
  constructor(private readonly svc: CtvRequestsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async list() {
    return this.svc.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post(':id/approve')
  async approve(@Param('id') id: string, @Req() req: any) {
    return this.svc.approve(Number(id), req?.user?.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post(':id/reject')
  async reject(@Param('id') id: string, @Req() req: any) {
    return this.svc.reject(Number(id), req?.user?.id);
  }
}
