import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceProvidersService } from './service-providers.service';
import { ServiceProvidersController } from './service-providers.controller';
import { AdminServiceProvidersController } from './admin-service-providers.controller';
import { ServiceProvider } from './entities/service-provider.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ServiceProvider])],
    controllers: [ServiceProvidersController, AdminServiceProvidersController],
    providers: [ServiceProvidersService],
    exports: [ServiceProvidersService],
})
export class ServiceProvidersModule { }
