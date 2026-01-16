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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryType } from './entities/category.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/roles.decorator';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
    constructor(private readonly service: CategoriesService) { }

    // @Roles('admin', 'host')
    @Post()
    create(@Body() dto: CreateCategoryDto) {
        return this.service.create(dto);
    }

    @Get()
    findAll(@Query('type') type?: CategoryType) {
        return this.service.findAll(type);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(+id);
    }

    // @Roles('admin', 'host')
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: Partial<CreateCategoryDto>) {
        return this.service.update(+id, dto);
    }

    // @Roles('admin', 'host')
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(+id);
    }
}
