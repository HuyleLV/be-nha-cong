import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CtvRequest } from './entities/ctv-request.entity';
import { CtvRequestsService } from './ctv-requests.service';
import { CtvRequestsController, AdminCtvRequestsController } from './ctv-requests.controller';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CtvRequest, User])],
  providers: [CtvRequestsService],
  controllers: [CtvRequestsController, AdminCtvRequestsController],
  exports: [CtvRequestsService],
})
export class CtvRequestsModule {}
