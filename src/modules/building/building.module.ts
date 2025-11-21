import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuildingService } from './building.service';
import { BuildingController } from './building.controller';
import { Building } from './entities/building.entity';
import { Location } from 'src/modules/locations/entities/locations.entity';
import { Apartment } from 'src/modules/apartment/entities/apartment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Building, Location, Apartment])],
  controllers: [BuildingController],
  providers: [BuildingService],
  exports: [BuildingService],
})
export class BuildingsModule {}
