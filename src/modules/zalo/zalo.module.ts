import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZaloTokenEntity } from './zalo-token.entity';
import { ZaloService } from './zalo.service';

@Module({
  imports: [TypeOrmModule.forFeature([ZaloTokenEntity])],
  providers: [ZaloService],
  exports: [TypeOrmModule, ZaloService],
})
export class ZaloModule {}
