import { DataSource } from 'typeorm';
import {
  Partners,
  PartnerRole,
  PartnerStatus,
} from '../../modules/partners/entities/partners.entity';

/**
 * Partners Seeding
 * Creates sample business partners
 */
export async function seedPartners(dataSource: DataSource) {
  console.log('🤝 Seeding partners...');

  const partnerRepository = dataSource.getRepository(Partners);

  const partnerData = [
    {
      role: 'landlord' as PartnerRole,
      fullName: 'Công ty TNHH Bất Động Sản ABC',
      phone: '+84901234580',
      email: 'contact@abc-realestate.com',
      need: 'Tìm đối tác để quản lý và cho thuê các căn hộ trong dự án mới',
      status: 'approved' as PartnerStatus,
    },
    {
      role: 'landlord' as PartnerRole,
      fullName: 'Chị Nguyễn Thị Lan',
      phone: '+84901234581',
      email: 'nguyenthilan@example.com',
      need: 'Cần tìm đối tác để quản lý 10 căn hộ cho thuê tại quận Ba Đình',
      status: 'approved' as PartnerStatus,
    },
    {
      role: 'operator' as PartnerRole,
      fullName: 'Công ty Dịch vụ Quản lý Tài sản XYZ',
      phone: '+84901234582',
      email: 'info@xyz-property.com',
      need: 'Cung cấp dịch vụ quản lý tài sản, bảo trì, vệ sinh cho các tòa nhà',
      status: 'approved' as PartnerStatus,
    },
    {
      role: 'customer' as PartnerRole,
      fullName: 'Công ty Công nghệ TechStart',
      phone: '+84901234583',
      email: 'hr@techstart.com',
      need: 'Cần tìm căn hộ cho thuê dài hạn cho nhân viên công ty (khoảng 20 phòng)',
      status: 'pending' as PartnerStatus,
    },
    {
      role: 'landlord' as PartnerRole,
      fullName: 'Anh Trần Văn Minh',
      phone: '+84901234584',
      email: 'tranvanminh@example.com',
      need: 'Có 5 phòng trọ cần tìm đối tác để quảng bá và cho thuê',
      status: 'approved' as PartnerStatus,
    },
  ];

  let createdCount = 0;
  for (const data of partnerData) {
    const existing = await partnerRepository.findOne({
      where: { email: data.email },
    });

    if (!existing) {
      const partner = partnerRepository.create(data);
      await partnerRepository.save(partner);
      createdCount++;
      console.log(`✅ Created partner: ${data.fullName}`);
    }
  }

  if (createdCount === 0) {
    console.log('⚠️  Partners already exist, skipping...');
  } else {
    console.log(`✅ Created ${createdCount} partners`);
  }
}
