import { CreateNewsDto } from './create-news.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateNewsDto extends PartialType(CreateNewsDto) { }
