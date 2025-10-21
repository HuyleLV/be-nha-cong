// src/viewings/viewings.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ViewingsService } from './viewings.service';
import { ViewingsController } from './viewings.controller';
import { Viewing } from './entities/viewing.entity';
import { Apartment } from '../apartment/entities/apartment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Viewing, Apartment])],
  controllers: [ViewingsController],
  providers: [ViewingsService],
  exports: [ViewingsService],
})
export class ViewingsModule {}
