import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Viewing } from '../viewings/entities/viewing.entity';
import { Apartment } from '../apartment/entities/apartment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Viewing, Apartment])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
