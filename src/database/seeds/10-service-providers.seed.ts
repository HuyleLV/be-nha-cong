import { DataSource } from 'typeorm';
import {
  ServiceProvider,
  ServiceType,
  ServiceProviderStatus,
} from '../../modules/service-providers/entities/service-provider.entity';
import { Location } from '../../modules/locations/entities/locations.entity';
import { User } from '../../modules/users/entities/user.entity';
import { ensureUniqueSlug } from '../../common/helpers/slug.helper';

/**
 * Service Providers Seeding
 * Creates sample service providers (thợ) for various services
 */
export async function seedServiceProviders(
  dataSource: DataSource,
  locations: any,
  host?: User,
) {
  console.log('🔧 Seeding service providers...');

  const providerRepository = dataSource.getRepository(ServiceProvider);
  const locationRepository = dataSource.getRepository(Location);

  // Get a ward for location (mô hình 2 cấp: districts key now contains wards)
  let districtId: number | null = null;
  if (locations.districts) {
    const firstWard = Object.values(locations.districts)[0] as any;
    districtId = firstWard?.id || null;
  }

  const providersData = [
    // Điện
    {
      name: 'Anh Tuấn - Thợ điện chuyên nghiệp',
      serviceType: ServiceType.DIEN,
      phone: '0912345678',
      email: 'tuan.dien@example.com',
      locationId: districtId,
      address: '123 Đường Láng, Ba Đình, Hà Nội',
      rating: '4.8',
      reviews: 45,
      avatarUrl: null,
      description:
        'Chuyên sửa chữa, lắp đặt điện dân dụng và công nghiệp. Có hơn 10 năm kinh nghiệm, làm việc nhanh chóng, uy tín.',
      priceFrom: '200000',
      priceTo: '500000',
      status: ServiceProviderStatus.ACTIVE,
      isVerified: true,
      yearsOfExperience: 10,
      workingHours: '7:00 - 19:00 (T2-CN)',
      serviceAreas: ['Ba Đình', 'Hoàn Kiếm', 'Đống Đa', 'Hai Bà Trưng'],
      createdBy: host?.id || null,
    },
    {
      name: 'Đội thợ điện Minh Đức',
      serviceType: ServiceType.DIEN,
      phone: '0987654321',
      email: 'minhduc.dien@example.com',
      locationId: districtId,
      address: '456 Phố Hàng Bông, Hoàn Kiếm, Hà Nội',
      rating: '4.6',
      reviews: 32,
      avatarUrl: null,
      description:
        'Đội thợ điện chuyên nghiệp, có giấy phép hành nghề. Nhận sửa chữa, lắp đặt, bảo trì hệ thống điện.',
      priceFrom: '150000',
      priceTo: '400000',
      status: ServiceProviderStatus.ACTIVE,
      isVerified: true,
      yearsOfExperience: 8,
      workingHours: '8:00 - 18:00 (T2-T7)',
      serviceAreas: ['Hoàn Kiếm', 'Ba Đình', 'Tây Hồ'],
      createdBy: host?.id || null,
    },
    // Nước
    {
      name: 'Anh Hùng - Thợ nước',
      serviceType: ServiceType.NUOC,
      phone: '0923456789',
      email: 'hung.nuoc@example.com',
      locationId: districtId,
      address: '789 Đường Giải Phóng, Hai Bà Trưng, Hà Nội',
      rating: '4.7',
      reviews: 28,
      avatarUrl: null,
      description:
        'Chuyên sửa chữa đường ống nước, vòi nước, bồn cầu, bồn rửa. Làm việc 24/7, có mặt nhanh chóng.',
      priceFrom: '100000',
      priceTo: '300000',
      status: ServiceProviderStatus.ACTIVE,
      isVerified: true,
      yearsOfExperience: 12,
      workingHours: '24/7',
      serviceAreas: ['Hai Bà Trưng', 'Hoàng Mai', 'Thanh Xuân'],
      createdBy: host?.id || null,
    },
    {
      name: 'Công ty sửa chữa nước Thành Đạt',
      serviceType: ServiceType.NUOC,
      phone: '0934567890',
      email: 'thanhdat.nuoc@example.com',
      locationId: districtId,
      address: '321 Đường Láng, Đống Đa, Hà Nội',
      rating: '4.5',
      reviews: 15,
      avatarUrl: null,
      description:
        'Công ty chuyên sửa chữa, lắp đặt hệ thống nước. Có đội ngũ thợ lành nghề, thiết bị hiện đại.',
      priceFrom: '120000',
      priceTo: '350000',
      status: ServiceProviderStatus.ACTIVE,
      isVerified: true,
      yearsOfExperience: 15,
      workingHours: '7:00 - 20:00 (T2-CN)',
      serviceAreas: ['Đống Đa', 'Cầu Giấy', 'Ba Đình'],
      createdBy: host?.id || null,
    },
    // Sửa chữa
    {
      name: 'Anh Long - Thợ sửa chữa đa năng',
      serviceType: ServiceType.SUA_CHUA,
      phone: '0945678901',
      email: 'long.suachua@example.com',
      locationId: districtId,
      address: '654 Đường Nguyễn Trãi, Thanh Xuân, Hà Nội',
      rating: '4.9',
      reviews: 67,
      avatarUrl: null,
      description:
        'Thợ sửa chữa đa năng: điều hòa, tủ lạnh, máy giặt, quạt, đồ điện tử. Kinh nghiệm 15 năm, giá cả hợp lý.',
      priceFrom: '150000',
      priceTo: '600000',
      status: ServiceProviderStatus.ACTIVE,
      isVerified: true,
      yearsOfExperience: 15,
      workingHours: '7:00 - 19:00 (T2-CN)',
      serviceAreas: ['Thanh Xuân', 'Cầu Giấy', 'Đống Đa', 'Hai Bà Trưng'],
      createdBy: host?.id || null,
    },
    {
      name: 'Trung tâm sửa chữa điện tử Minh Anh',
      serviceType: ServiceType.SUA_CHUA,
      phone: '0956789012',
      email: 'minhanh.suachua@example.com',
      locationId: districtId,
      address: '987 Đường Láng, Cầu Giấy, Hà Nội',
      rating: '4.4',
      reviews: 23,
      avatarUrl: null,
      description:
        'Chuyên sửa chữa đồ điện tử, điện lạnh. Có xưởng sửa chữa, bảo hành sau sửa chữa.',
      priceFrom: '200000',
      priceTo: '800000',
      status: ServiceProviderStatus.ACTIVE,
      isVerified: true,
      yearsOfExperience: 20,
      workingHours: '8:00 - 18:00 (T2-T7)',
      serviceAreas: ['Cầu Giấy', 'Đống Đa', 'Ba Đình'],
      createdBy: host?.id || null,
    },
    // Vệ sinh
    {
      name: 'Dịch vụ vệ sinh nhà cửa Sạch Sẽ',
      serviceType: ServiceType.VE_SINH,
      phone: '0967890123',
      email: 'sachse.vesinh@example.com',
      locationId: districtId,
      address: '147 Đường Hoàng Hoa Thám, Ba Đình, Hà Nội',
      rating: '4.8',
      reviews: 89,
      avatarUrl: null,
      description:
        'Dịch vụ vệ sinh nhà cửa, văn phòng chuyên nghiệp. Đội ngũ nhân viên được đào tạo, sử dụng hóa chất an toàn.',
      priceFrom: '300000',
      priceTo: '1500000',
      status: ServiceProviderStatus.ACTIVE,
      isVerified: true,
      yearsOfExperience: 5,
      workingHours: '7:00 - 20:00 (T2-CN)',
      serviceAreas: [
        'Ba Đình',
        'Hoàn Kiếm',
        'Đống Đa',
        'Hai Bà Trưng',
        'Cầu Giấy',
      ],
      createdBy: host?.id || null,
    },
    {
      name: 'Chị Mai - Vệ sinh chuyên nghiệp',
      serviceType: ServiceType.VE_SINH,
      phone: '0978901234',
      email: 'mai.vesinh@example.com',
      locationId: districtId,
      address: '258 Đường Láng, Đống Đa, Hà Nội',
      rating: '4.6',
      reviews: 41,
      avatarUrl: null,
      description:
        'Chuyên vệ sinh nhà cửa, chung cư, văn phòng. Làm việc cẩn thận, tỉ mỉ, giá cả hợp lý.',
      priceFrom: '250000',
      priceTo: '1200000',
      status: ServiceProviderStatus.ACTIVE,
      isVerified: true,
      yearsOfExperience: 7,
      workingHours: '6:00 - 21:00 (T2-CN)',
      serviceAreas: ['Đống Đa', 'Cầu Giấy', 'Thanh Xuân'],
      createdBy: host?.id || null,
    },
    // Sơn
    {
      name: 'Đội thợ sơn Hùng Vương',
      serviceType: ServiceType.SON,
      phone: '0989012345',
      email: 'hungvuong.son@example.com',
      locationId: districtId,
      address: '369 Đường Giải Phóng, Hai Bà Trưng, Hà Nội',
      rating: '4.7',
      reviews: 35,
      avatarUrl: null,
      description:
        'Chuyên sơn nhà, sơn tường, sơn cửa. Sử dụng sơn chất lượng cao, bảo hành công trình.',
      priceFrom: '50000',
      priceTo: '150000',
      status: ServiceProviderStatus.ACTIVE,
      isVerified: true,
      yearsOfExperience: 12,
      workingHours: '7:00 - 18:00 (T2-CN)',
      serviceAreas: ['Hai Bà Trưng', 'Hoàng Mai', 'Thanh Xuân', 'Đống Đa'],
      createdBy: host?.id || null,
    },
    {
      name: 'Anh Dũng - Thợ sơn chuyên nghiệp',
      serviceType: ServiceType.SON,
      phone: '0990123456',
      email: 'dung.son@example.com',
      locationId: districtId,
      address: '741 Đường Láng, Ba Đình, Hà Nội',
      rating: '4.5',
      reviews: 19,
      avatarUrl: null,
      description:
        'Thợ sơn có kinh nghiệm, làm việc nhanh gọn, sạch sẽ. Nhận sơn nhà, căn hộ, văn phòng.',
      priceFrom: '40000',
      priceTo: '120000',
      status: ServiceProviderStatus.ACTIVE,
      isVerified: false,
      yearsOfExperience: 8,
      workingHours: '8:00 - 17:00 (T2-T7)',
      serviceAreas: ['Ba Đình', 'Hoàn Kiếm', 'Tây Hồ'],
      createdBy: host?.id || null,
    },
    // Lắp đặt
    {
      name: 'Công ty lắp đặt nội thất Đức Anh',
      serviceType: ServiceType.LAP_DAT,
      phone: '0901234567',
      email: 'ducanh.lapdat@example.com',
      locationId: districtId,
      address: '852 Đường Nguyễn Trãi, Thanh Xuân, Hà Nội',
      rating: '4.8',
      reviews: 52,
      avatarUrl: null,
      description:
        'Chuyên lắp đặt nội thất, tủ bếp, cửa, điều hòa, quạt trần. Đội ngũ thợ chuyên nghiệp, thiết bị hiện đại.',
      priceFrom: '200000',
      priceTo: '1000000',
      status: ServiceProviderStatus.ACTIVE,
      isVerified: true,
      yearsOfExperience: 10,
      workingHours: '7:00 - 19:00 (T2-CN)',
      serviceAreas: ['Thanh Xuân', 'Cầu Giấy', 'Đống Đa', 'Hai Bà Trưng'],
      createdBy: host?.id || null,
    },
    {
      name: 'Anh Thành - Thợ lắp đặt',
      serviceType: ServiceType.LAP_DAT,
      phone: '0912345679',
      email: 'thanh.lapdat@example.com',
      locationId: districtId,
      address: '963 Đường Láng, Cầu Giấy, Hà Nội',
      rating: '4.6',
      reviews: 27,
      avatarUrl: null,
      description:
        'Chuyên lắp đặt điều hòa, quạt, đèn, ổ cắm điện. Làm việc nhanh, gọn, đảm bảo chất lượng.',
      priceFrom: '150000',
      priceTo: '500000',
      status: ServiceProviderStatus.ACTIVE,
      isVerified: true,
      yearsOfExperience: 9,
      workingHours: '8:00 - 18:00 (T2-CN)',
      serviceAreas: ['Cầu Giấy', 'Đống Đa', 'Ba Đình'],
      createdBy: host?.id || null,
    },
    // Nội thất
    {
      name: 'Xưởng nội thất Minh Phương',
      serviceType: ServiceType.NOI_THAT,
      phone: '0923456780',
      email: 'minhphuong.noithat@example.com',
      locationId: districtId,
      address: '159 Đường Hoàng Hoa Thám, Ba Đình, Hà Nội',
      rating: '4.7',
      reviews: 38,
      avatarUrl: null,
      description:
        'Chuyên thiết kế, sản xuất và lắp đặt nội thất. Có xưởng sản xuất, nhận đặt hàng theo yêu cầu.',
      priceFrom: '500000',
      priceTo: '5000000',
      status: ServiceProviderStatus.ACTIVE,
      isVerified: true,
      yearsOfExperience: 18,
      workingHours: '8:00 - 18:00 (T2-T7)',
      serviceAreas: ['Ba Đình', 'Hoàn Kiếm', 'Đống Đa', 'Cầu Giấy', 'Tây Hồ'],
      createdBy: host?.id || null,
    },
    {
      name: 'Cửa hàng nội thất Hòa Phát',
      serviceType: ServiceType.NOI_THAT,
      phone: '0934567891',
      email: 'hoaphat.noithat@example.com',
      locationId: districtId,
      address: '357 Đường Giải Phóng, Hai Bà Trưng, Hà Nội',
      rating: '4.4',
      reviews: 21,
      avatarUrl: null,
      description:
        'Bán và lắp đặt nội thất: giường, tủ, bàn ghế, kệ sách. Hàng có sẵn, giao hàng nhanh.',
      priceFrom: '300000',
      priceTo: '3000000',
      status: ServiceProviderStatus.ACTIVE,
      isVerified: true,
      yearsOfExperience: 6,
      workingHours: '8:00 - 20:00 (T2-CN)',
      serviceAreas: ['Hai Bà Trưng', 'Hoàng Mai', 'Thanh Xuân'],
      createdBy: host?.id || null,
    },
  ];

  const providers: ServiceProvider[] = [];

  for (const data of providersData) {
    // Check if provider already exists (by phone)
    const existing = await providerRepository.findOne({
      where: { phone: data.phone },
    });

    if (!existing) {
      // Generate slug from name
      const slug = await ensureUniqueSlug(providerRepository, data.name);

      const provider = providerRepository.create({
        ...data,
        slug,
      });
      const saved = await providerRepository.save(provider);
      providers.push(saved);
    } else {
      // Update existing provider with slug if missing
      if (!existing.slug) {
        existing.slug = await ensureUniqueSlug(providerRepository, existing.name, existing.id);
        await providerRepository.save(existing);
      }
      providers.push(existing);
    }
  }

  console.log(
    `✅ Created ${providers.length} service providers (${providersData.length} total)`,
  );
  return providers;
}
