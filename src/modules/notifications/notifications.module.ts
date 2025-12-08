import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { ContractsModule } from '../contracts/contracts.module';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), ContractsModule],
  providers: [NotificationService, NotificationsGateway],
  controllers: [NotificationController],
  exports: [NotificationService]
})
export class NotificationsModule {}
