import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PhoneVerifiedGuard } from '../auth/phone-verified.guard';

@Controller('comments')
export class CommentsController {
  constructor(private readonly srv: CommentsService) {}

  // Public listing for a target
  @Get(':targetType/:targetId')
  async list(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('take') take = '20',
    @Query('skip') skip = '0',
  ) {
    // targetId might be a slug (string) for blog, or numeric id for apartments
    // Support page/limit (1-based page) or take/skip legacy params
    if (page) {
      const p = Math.max(1, Number(page) || 1);
      const l = Math.max(1, Number(limit) || 20);
      const computedSkip = (p - 1) * l;
      return this.srv.list(targetType, targetId, l, computedSkip);
    }
    return this.srv.list(targetType, targetId, Number(take), Number(skip));
  }

  // Create comment - only for authenticated users with verified phone
  @UseGuards(JwtAuthGuard, PhoneVerifiedGuard)
  @Post()
  async create(@Req() req: any, @Body() dto: CreateCommentDto) {
    const userId = req.user?.id ?? req.user?.sub;
    return this.srv.create(userId, dto.targetType, dto.targetId, dto.content);
  }
}
