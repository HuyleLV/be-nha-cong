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
import { BuildingsModule } from './modules/building/building.module';
import { OwnershipsModule } from './modules/ownership/ownership.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { View } from 'typeorm';
import { ViewingsModule } from './modules/viewings/viewings.module';
import mailConfig from './config/mail.config';
import { CommentsModule } from './modules/comments/comments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, mailConfig],
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
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads', 'videos'),
      serveRoot: '/static/videos',
    }),
    UploadModule,
    UsersModule,
    BlogModule,
    AuthModule,
    LocationsModule,
    ApartmentsModule,
    PartnersModule,
    BuildingsModule,
    OwnershipsModule,
    FavoritesModule,
    ViewingsModule,
    CommentsModule
  ],
})
export class AppModule {}
