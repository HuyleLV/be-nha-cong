// src/modules/apartments/apartments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApartmentsService } from './apartments.service';
import { ApartmentsController } from './apartments.controller';
import { Apartment } from './entities/apartment.entity';
import { Location } from '../locations/entities/locations.entity';
import { Building } from '../building/entities/building.entity';
import { Favorite } from '../favorites/entities/favorite.entity'; // <-- import entity Favorite
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Apartment,
      Location,
      Building,
  Favorite,
  User,
    ]),
  ],
  controllers: [ApartmentsController],
  providers: [ApartmentsService],
  exports: [ApartmentsService],
})
export class ApartmentsModule {}
