import { Module } from '@nestjs/common';
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
    // Meter readings (host) module
    require('./modules/meter-reading/meter-reading.module').MeterReadingModule,
    // Invoices module
    require('./modules/invoice/invoice.module').InvoiceModule,
    // Deposits module
    require('./modules/deposits/deposits.module').DepositsModule,
    // Contracts module
    require('./modules/contracts/contracts.module').ContractsModule,
    require('./modules/rent-schedules/rent-schedules.module').RentSchedulesModule,
    require('./modules/rent-calculation/rent-calculation.module').RentCalculationModule,
    require('./modules/automated-invoice/automated-invoice.module').AutomatedInvoiceModule,
    require('./modules/admin-dashboard/admin-dashboard.module').AdminDashboardModule,
    require('./modules/landlord-dashboard/landlord-dashboard.module').LandlordDashboardModule,
    MeterReadingModule,
    InvoiceModule,
    DepositsModule,
    ContractsModule,
    LocationsModule,
    ApartmentsModule,
    PartnersModule,
    BuildingsModule,
    BedsModule,
    AssetsModule,
    // Vehicles module
    require('./modules/vehicles/vehicles.module').VehiclesModule,
    require('./modules/services/services.module').ServicesModule,
    require('./modules/service-requests/service-requests.module').ServiceRequestsModule,
    // Reports (warranty / repair / fire / complaint)
    require('./modules/reports/reports.module').ReportsModule,
    VehiclesModule,
    ServicesModule,
    ServiceRequestsModule,
    ReportsModule,
    OwnershipsModule,
    FavoritesModule,
    ViewingsModule,
    CommentsModule,
    JobsModule,
    require('./modules/news/news.module').NewsModule,
    require('./modules/ctv-requests/ctv-requests.module').CtvRequestsModule,
    require('./modules/thu-chi/thu-chi.module').ThuChiModule,
    // Bank accounts for hosts
    require('./modules/bank-accounts/bank-accounts.module').BankAccountsModule,
    // Scheduler module (daily jobs)
    require('./modules/scheduler/scheduler.module').SchedulerModule,
    // Notifications (english module name)
    require('./modules/notifications/notifications.module').NotificationsModule,
    // Conversations / messaging
    require('./modules/conversations/conversations.module').ConversationsModule,
    // Tasks (english module name)
    require('./modules/tasks/tasks.module').TasksModule,
    // Newly ported modules
    require('./modules/host-settings/host-settings.module').HostSettingsModule,
    require('./modules/system-settings/system-settings.module').SystemSettingsModule,
    require('./modules/advertisements/advertisements.module').AdvertisementsModule,
    require('./modules/categories/categories.module').CategoriesModule,
    require('./modules/service-providers/service-providers.module').ServiceProvidersModule,
    // Finance / Reporting
    require('./modules/finance/finance.module').FinanceModule,
    require('./modules/points/points.module').PointsModule,
    require('./modules/promotions/promotions.module').PromotionsModule,
    require('./modules/offers/offers.module').OffersModule
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
export class AppModule { }
