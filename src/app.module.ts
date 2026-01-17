import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { UsersModule } from './modules/users/users.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BlogModule } from './modules/blog/blog.module';
import { AuthModule } from './modules/auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { LocationsModule } from './modules/locations/locations.module';
import { ApartmentsModule } from './modules/apartment/apartments.module';
import { PartnersModule } from './modules/partners/partners.module';
import { BuildingsModule } from './modules/building/building.module';
import { BedsModule } from './modules/bed/bed.module';
import { AssetsModule } from './modules/asset/asset.module';
import { OwnershipsModule } from './modules/ownership/ownership.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { View } from 'typeorm';
import { ViewingsModule } from './modules/viewings/viewings.module';
import mailConfig from './config/mail.config';
import { CommentsModule } from './modules/comments/comments.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import storageConfig from './config/storage.config';
import { MeterReadingModule } from './modules/meter-reading/meter-reading.module';
import { RentSchedulesModule } from './modules/rent-schedules/rent-schedules.module';
import { RentCalculationModule } from './modules/rent-calculation/rent-calculation.module';
import { AutomatedInvoiceModule } from './modules/automated-invoice/automated-invoice.module';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { LandlordDashboardModule } from './modules/landlord-dashboard/landlord-dashboard.module';
import { HostSettingsModule } from './modules/host-settings/host-settings.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';
import { AdvertisementsModule } from './modules/advertisements/advertisements.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ServiceProvidersModule } from './modules/service-providers/service-providers.module';
import { FinanceModule } from './modules/finance/finance.module';
import * as cors from 'cors';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { DepositsModule } from './modules/deposits/deposits.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { ServicesModule } from './modules/services/services.module';
import { ServiceRequestsModule } from './modules/service-requests/service-requests.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NewsModule } from './modules/news/news.module';
import { CtvRequestsModule } from './modules/ctv-requests/ctv-requests.module';
import { ThuChiModule } from './modules/thu-chi/thu-chi.module';
import { BankAccountsModule } from './modules/bank-accounts/bank-accounts.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { TasksModule } from './modules/tasks/tasks.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 300, // Increased limit for map interactions
    }]),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, mailConfig, storageConfig],
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
    // Scheduler (daily jobs)
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads', 'images'),
      serveRoot: '/static/images',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads', 'videos'),
      serveRoot: '/static/videos',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads', 'docs'),
      serveRoot: '/static/docs',
    }),
    UploadModule,
    UsersModule,
    BlogModule,
    AuthModule,

    // Core feature modules
    MeterReadingModule,
    InvoiceModule,
    DepositsModule,
    ContractsModule,
    RentSchedulesModule,
    RentCalculationModule,
    AutomatedInvoiceModule,
    AdminDashboardModule,
    LandlordDashboardModule,

    LocationsModule,
    ApartmentsModule,
    PartnersModule,
    BuildingsModule,
    BedsModule,
    AssetsModule,
    VehiclesModule,
    ServicesModule,
    ServiceRequestsModule,
    ReportsModule,
    OwnershipsModule,
    FavoritesModule,
    ViewingsModule,
    CommentsModule,
    JobsModule,
    NewsModule,
    CtvRequestsModule,
    ThuChiModule,

    // Finance & utilities
    BankAccountsModule,
    SchedulerModule,
    NotificationsModule,
    ConversationsModule,
    TasksModule,

    // Newly ported / admin modules
    HostSettingsModule,
    SystemSettingsModule,
    AdvertisementsModule,
    CategoriesModule,
    ServiceProvidersModule,
    FinanceModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    JobsModule,
    NewsModule,
    CtvRequestsModule,
    ThuChiModule,
    BankAccountsModule,
    SchedulerModule,
    NotificationsModule,
    ConversationsModule,
    TasksModule
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cors({ origin: true, credentials: true })).forRoutes('*');
  }
}
