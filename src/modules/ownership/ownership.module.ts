import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OwnershipsService } from './ownership.service';
import { OwnershipsController } from './ownership.controller';
import { Ownership } from './entities/ownership.entity';
import { Building } from '../building/entities/building.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ownership, Building, User])],
  controllers: [OwnershipsController],
  providers: [OwnershipsService],
  exports: [OwnershipsService],
})
export class OwnershipsModule {}
