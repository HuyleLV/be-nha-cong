import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Apartment } from '../apartment/entities/apartment.entity';
// import { VehicleBooking, VehicleBookingStatus } from '../vehicle-bookings/entities/vehicle-booking.entity';
// import { Job, JobStatus } from '../jobs/entities/job.entity';
import { Contract, ContractStatus } from '../contracts/entities/contract.entity';
// import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
// import { ServiceBooking, ServiceBookingStatus } from '../service-bookings/entities/service-booking.entity';
import { ServiceProvider, ServiceProviderStatus } from '../service-providers/entities/service-provider.entity';
import { Building } from '../building/entities/building.entity';
import { Viewing } from '../viewings/entities/viewing.entity';

/**
 * Admin Dashboard Service
 * 
 * Provides statistics and metrics for admin dashboard
 */
@Injectable()
export class AdminDashboardService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Apartment)
        private readonly apartmentRepo: Repository<Apartment>,
        // @InjectRepository(VehicleBooking)
        // private readonly vehicleBookingRepo: Repository<VehicleBooking>,
        // @InjectRepository(Job)
        // private readonly jobRepo: Repository<Job>,
        @InjectRepository(Contract)
        private readonly contractRepo: Repository<Contract>,
        // @InjectRepository(Payment)
        // private readonly paymentRepo: Repository<Payment>,
        // @InjectRepository(ServiceBooking)
        // private readonly serviceBookingRepo: Repository<ServiceBooking>,
        @InjectRepository(ServiceProvider)
        private readonly serviceProviderRepo: Repository<ServiceProvider>,
        @InjectRepository(Building)
        private readonly buildingRepo: Repository<Building>,
        @InjectRepository(Viewing)
        private readonly viewingRepo: Repository<Viewing>,
    ) { }

    /**
     * Get comprehensive dashboard statistics
     */
    async getStats() {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        // Users statistics
        const [totalUsers, newUsersToday, newUsersThisMonth] = await Promise.all([
            this.userRepo.count(),
            this.userRepo.count({
                where: {
                    createdAt: Between(todayStart, todayEnd),
                },
            }),
            this.userRepo.count({
                where: {
                    createdAt: MoreThanOrEqual(thisMonthStart),
                },
            }),
        ]);
        // Note: User entity doesn't have 'status' field, using totalUsers as activeUsers
        const activeUsers = totalUsers;

        // Apartments statistics
        const [
            totalApartments,
            publishedApartments,
            pendingApartments,
            verifiedApartments,
        ] = await Promise.all([
            this.apartmentRepo.count(),
            this.apartmentRepo.count({ where: { status: 'published', isApproved: true } }),
            this.apartmentRepo.count({ where: { status: 'published', isApproved: false } }),
            this.apartmentRepo.count({ where: { isVerified: true } }),
        ]);

        // Vehicle bookings statistics (Removed)
        const [
            totalBookings,
            bookingsToday,
            confirmedBookings,
            completedBookings,
        ] = [0, 0, 0, 0];

        // Revenue statistics (Removed)
        const totalRevenue = 0;
        const monthlyRevenue: any[] = [];

        // Jobs statistics (Removed for now to avoid complexity if missing)
        const [totalJobs, pendingJobs, publishedJobs] = [0, 0, 0];

        // Contracts statistics
        const [totalContracts, activeContracts, expiringContracts] = await Promise.all([
            this.contractRepo.count(),
            this.contractRepo.count({ where: { status: ContractStatus.ACTIVE } }),
            this.contractRepo.count({
                where: {
                    status: ContractStatus.ACTIVE,
                    expiryDate: Between(now, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)),
                },
            }),
        ]);

        // Payments statistics (Removed)
        const [totalPayments, pendingPayments, completedPayments] = [0, 0, 0];

        // Service bookings statistics (Removed)
        const [totalServiceBookings, pendingServiceBookings] = [0, 0];

        // Service providers statistics
        const [totalServiceProviders, activeServiceProviders] = await Promise.all([
            this.serviceProviderRepo.count(),
            this.serviceProviderRepo.count({ where: { status: ServiceProviderStatus.ACTIVE } }),
        ]);

        // Buildings statistics
        const totalBuildings = await this.buildingRepo.count();

        // Viewings statistics
        const viewingsToday = await this.viewingRepo.count({
            where: {
                preferredAt: Between(todayStart, todayEnd),
            },
        });

        return {
            users: {
                total: totalUsers,
                active: activeUsers,
                newToday: newUsersToday,
                newThisMonth: newUsersThisMonth,
            },
            apartments: {
                total: totalApartments,
                published: publishedApartments,
                pending: pendingApartments,
                verified: verifiedApartments,
            },
            bookings: {
                total: totalBookings,
                today: bookingsToday,
                confirmed: confirmedBookings,
                completed: completedBookings,
                revenue: totalRevenue,
            },
            jobs: {
                total: totalJobs,
                pending: pendingJobs,
                published: publishedJobs,
            },
            contracts: {
                total: totalContracts,
                active: activeContracts,
                expiring: expiringContracts,
            },
            payments: {
                total: totalPayments,
                pending: pendingPayments,
                completed: completedPayments,
            },
            services: {
                bookings: totalServiceBookings,
                pendingBookings: pendingServiceBookings,
                providers: totalServiceProviders,
                activeProviders: activeServiceProviders,
            },
            buildings: {
                total: totalBuildings,
            },
            viewings: {
                today: viewingsToday,
            },
            revenue: {
                total: totalRevenue,
                monthly: monthlyRevenue,
            },
        };
    }

    /**
     * Get recent activities
     */
    async getRecentActivities(limit = 10) {
        const activities: any[] = [];

        // Recent users
        const recentUsers = await this.userRepo.find({
            take: 5,
            order: { createdAt: 'DESC' },
        });
        recentUsers.forEach((user) => {
            activities.push({
                type: 'user_created',
                title: `Người dùng mới: ${user.name || user.email}`,
                timestamp: user.createdAt,
                userId: user.id,
            });
        });

        // Recent apartments
        const recentApartments = await this.apartmentRepo.find({
            take: 5,
            order: { createdAt: 'DESC' },
        });
        recentApartments.forEach((apt) => {
            activities.push({
                type: 'apartment_created',
                title: `Căn hộ mới: ${apt.title}`,
                timestamp: apt.createdAt,
                apartmentId: apt.id,
            });
        });

        // Recent bookings (Removed)

        // Sort by timestamp and limit
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return activities.slice(0, limit);
    }

    /**
     * Get revenue chart data (Stubbed)
     */
    async getRevenueChart(period: 'week' | 'month' | 'year' = 'month') {
        return {
            period,
            data: []
        }
    }
}
