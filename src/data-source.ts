import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Import all entities
import { User } from './modules/users/entities/user.entity';
import { Apartment } from './modules/apartment/entities/apartment.entity';
import { Building } from './modules/building/entities/building.entity';
import { Location } from './modules/locations/entities/locations.entity';
import { Bed } from './modules/bed/entities/bed.entity';
import { Asset } from './modules/asset/entities/asset.entity';
import { Ownership } from './modules/ownership/entities/ownership.entity';
import { Favorite } from './modules/favorites/entities/favorite.entity';
// import { FavoriteList } from './modules/favorites/entities/favorite-list.entity';
import { Viewing } from './modules/viewings/entities/viewing.entity';
import { ApartmentView } from './modules/viewings/entities/apartment-view.entity';
import { Comment } from './modules/comments/comment.entity';
import { Blog } from './modules/blog/entities/blog.entity';
import { Job } from './modules/jobs/entities/job.entity';
import { JobApplication } from './modules/jobs/entities/job-application.entity';
import { Partners } from './modules/partners/entities/partners.entity';
import { Contract } from './modules/contracts/entities/contract.entity';
import { Deposit } from './modules/deposits/entities/deposit.entity';
import { Invoice } from './modules/invoice/entities/invoice.entity';
import { InvoiceItem } from './modules/invoice/entities/invoice-item.entity';
import { MeterReading } from './modules/meter-reading/entities/meter-reading.entity';
import { MeterReadingItem } from './modules/meter-reading/entities/meter-reading-item.entity';
import { Service } from './modules/services/entities/service.entity';
import { ServiceRequest } from './modules/service-requests/entities/service-request.entity';
import { Vehicle } from './modules/vehicles/entities/vehicle.entity';
import { ThuChi } from './modules/thu-chi/entities/thu-chi.entity';
import { ThuChiItem } from './modules/thu-chi/entities/thu-chi-item.entity';
import { Notification } from './modules/notifications/entities/notification.entity';
import { Task } from './modules/tasks/entities/task.entity';
import { ZaloTokenEntity } from './modules/zalo/zalo-token.entity';
// import { Payment } from './modules/payments/entities/payment.entity';
import { RentSchedule } from './modules/rent-schedules/entities/rent-schedule.entity';
// import { Commission } from './modules/commissions/entities/commission.entity';
import { ServiceProvider } from './modules/service-providers/entities/service-provider.entity';
// import { ServiceProviderReview } from './modules/service-provider-reviews/entities/service-provider-review.entity';
// import { ServiceBooking } from './modules/service-bookings/entities/service-booking.entity';
// import { VehicleBooking } from './modules/vehicle-bookings/entities/vehicle-booking.entity';
import { HostSettings } from './modules/host-settings/entities/host-settings.entity';
import { SystemSettings } from './modules/system-settings/entities/system-settings.entity';
import { Advertisement } from './modules/advertisements/entities/advertisement.entity';
import { Category } from './modules/categories/entities/category.entity';
import { News } from './modules/news/entities/news.entity';
// import { Conversation } from './modules/chat/entities/conversation.entity';
// import { Message } from './modules/chat/entities/message.entity';
import { BankAccount } from './modules/bank-accounts/entities/bank-account.entity';
import { Promotion } from './modules/promotions/entities/promotion.entity';
import { Offer } from './modules/offers/entities/offer.entity';
import { PointTransaction } from './modules/points/entities/point-transaction.entity';
import { CtvRequest } from './modules/ctv-requests/entities/ctv-request.entity';

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME ?? process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? '',
  database: process.env.DB_NAME || 'db_nhacong',
  entities: [
    User,
    Apartment,
    Building,
    Location,
    Bed,
    Asset,
    Ownership,
    Favorite,
    // FavoriteList,
    Viewing,
    ApartmentView,
    Comment,
    Blog,
    News,
    Job,
    JobApplication,
    Partners,
    Contract,
    Deposit,
    Invoice,
    InvoiceItem,
    MeterReading,
    MeterReadingItem,
    Service,
    ServiceRequest,
    Vehicle,
    ThuChi,
    ThuChiItem,
    Notification,
    Task,
    ZaloTokenEntity,
    // Payment,
    RentSchedule,
    // Commission,
    ServiceProvider,
    // ServiceProviderReview,
    // ServiceBooking,
    // VehicleBooking,
    HostSettings,
    SystemSettings,
    Advertisement,
    Category,
    // Conversation,
    // Message
    BankAccount,
    Promotion,
    Offer,
    CtvRequest,
    PointTransaction,
  ],
  migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
  synchronize: false, // Always false for migrations
  logging: process.env.DB_LOGGING === 'true',
  namingStrategy: new SnakeNamingStrategy(),
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
