import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { UsersModule } from './modules/users/users.module';
import { BlogModule } from './modules/blog/blog.module';
import { AuthModule } from './modules/auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { LocationsModule } from './modules/locations/locations.module';
import { ApartmentsModule } from './modules/apartment/apartments.module';
import { PartnersModule } from './modules/partners/partners.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'mysql',
        host: cfg.get<string>('database.host'),
        port: cfg.get<number>('database.port'),
        username: cfg.get<string>('database.username'),
        password: cfg.get<string>('database.password'),
        database: cfg.get<string>('database.database'),
        autoLoadEntities: true,
        synchronize: cfg.get<boolean>('database.synchronize'), 
        logging: cfg.get<boolean>('database.logging'),
        namingStrategy: new SnakeNamingStrategy(),
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads', 'images'),
      serveRoot: '/static/images',
    }),
    UploadModule,
    UsersModule,
    BlogModule,
    AuthModule,
    LocationsModule,
    ApartmentsModule,
    PartnersModule
  ],
})
export class AppModule {}
