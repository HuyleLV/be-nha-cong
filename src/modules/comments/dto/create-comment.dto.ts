import { IsNotEmpty, IsIn } from 'class-validator';

export class CreateCommentDto {
  @IsIn(['blog', 'apartment'])
  targetType!: 'blog' | 'apartment';

  // Allow numeric IDs (apartment) or string keys (blog slug)
  @IsNotEmpty()
  targetId!: string | number;

  @IsNotEmpty()
  content!: string;
}
