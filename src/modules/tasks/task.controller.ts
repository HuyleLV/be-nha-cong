import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('tasks')
export class TaskController {
  constructor(private readonly svc: TaskService) { }

  @Post()
  create(@Body() dto: CreateTaskDto) {
    return this.svc.create(dto);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('reports/stats')
  getReports(@Req() req: any) {
    return this.svc.getReports(req.user);
  }

  @Get()
  findAll(@Query() q: any) {
    return this.svc.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.svc.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(Number(id));
  }
}
