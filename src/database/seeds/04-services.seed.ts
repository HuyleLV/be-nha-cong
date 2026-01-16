import { DataSource } from 'typeorm';
import {
  Service,
  ServiceFeeType,
  ServicePriceType,
  ServiceUnit,
} from '../../modules/services/entities/service.entity';
import { Building } from '../../modules/building/entities/building.entity';
import { User } from '../../modules/users/entities/user.entity';

/**
 * Services Seeding
 * Creates common services (electricity, water, internet, etc.)
 */
export async function seedServices(
  dataSource: DataSource,
  buildings: Building[],
  host?: User,
) {
  console.log('🔧 Seeding services...');

  const serviceRepository = dataSource.getRepository(Service);

  // Common services (not tied to specific building)
  const commonServices = [
    {
      name: 'Tiền điện',
      feeType: ServiceFeeType.ELECTRIC,
      priceType: ServicePriceType.PER_UNIT,
      unitPrice: '3500',
      unit: ServiceUnit.KWH,
      taxRate: '0',
      note: 'Giá điện theo từng số KWh sử dụng',
    },
    {
      name: 'Tiền nước',
      feeType: ServiceFeeType.WATER,
      priceType: ServicePriceType.PER_UNIT,
      unitPrice: '25000',
      unit: ServiceUnit.M3,
      taxRate: '0',
      note: 'Giá nước theo từng m³ sử dụng',
    },
    {
      name: 'Internet cáp quang',
      feeType: ServiceFeeType.INTERNET,
      priceType: ServicePriceType.FIXED,
      unitPrice: '200000',
      unit: ServiceUnit.PHONG,
      taxRate: '0',
      note: 'Phí internet cố định hàng tháng',
    },
    {
      name: 'Phí dịch vụ chung',
      feeType: ServiceFeeType.SERVICE,
      priceType: ServicePriceType.FIXED,
      unitPrice: '500000',
      unit: ServiceUnit.PHONG,
      taxRate: '10',
      note: 'Phí dịch vụ chung của tòa nhà (bảo vệ, vệ sinh, bảo trì)',
    },
    {
      name: 'Phí gửi xe máy',
      feeType: ServiceFeeType.OTHER,
      priceType: ServicePriceType.FIXED,
      unitPrice: '100000',
      unit: ServiceUnit.XE,
      taxRate: '0',
      note: 'Phí gửi xe máy hàng tháng',
    },
    {
      name: 'Phí gửi xe ô tô',
      feeType: ServiceFeeType.OTHER,
      priceType: ServicePriceType.FIXED,
      unitPrice: '500000',
      unit: ServiceUnit.XE,
      taxRate: '0',
      note: 'Phí gửi xe ô tô hàng tháng',
    },
    {
      name: 'Phí rác thải',
      feeType: ServiceFeeType.OTHER,
      priceType: ServicePriceType.FIXED,
      unitPrice: '50000',
      unit: ServiceUnit.PHONG,
      taxRate: '0',
      note: 'Phí thu gom rác thải hàng tháng',
    },
    {
      name: 'Phí bảo hiểm',
      feeType: ServiceFeeType.OTHER,
      priceType: ServicePriceType.PERCENT,
      unitPrice: '5',
      unit: ServiceUnit.PHONG,
      taxRate: '0',
      note: 'Phí bảo hiểm tính theo % giá thuê',
    },
  ];

  let createdCount = 0;
  for (const data of commonServices) {
    const existing = await serviceRepository.findOne({
      where: {
        name: data.name,
        buildingId: null,
      },
    });

    if (!existing) {
      const service = serviceRepository.create({
        ...data,
        buildingId: null, // Common service, not tied to specific building
        createdById: host?.id,
      });
      await serviceRepository.save(service);
      createdCount++;
    }
  }

  // Building-specific services
  if (buildings.length > 0) {
    const buildingServices = [
      {
        name: 'Dịch vụ giặt ủi',
        feeType: ServiceFeeType.OTHER,
        priceType: ServicePriceType.PER_UNIT,
        unitPrice: '50000',
        unit: ServiceUnit.LUOT,
        taxRate: '0',
        buildingId: buildings[0]?.id,
        note: 'Dịch vụ giặt ủi theo lượt',
      },
      {
        name: 'Phí sử dụng phòng gym',
        feeType: ServiceFeeType.OTHER,
        priceType: ServicePriceType.FIXED,
        unitPrice: '200000',
        unit: ServiceUnit.PHONG,
        taxRate: '0',
        buildingId: buildings[0]?.id,
        note: 'Phí sử dụng phòng gym hàng tháng',
      },
    ];

    for (const data of buildingServices) {
      const existing = await serviceRepository.findOne({
        where: {
          name: data.name,
          buildingId: data.buildingId,
        },
      });

      if (!existing) {
        const service = serviceRepository.create({
          ...data,
          createdById: host?.id,
        });
        await serviceRepository.save(service);
        createdCount++;
      }
    }
  }

  if (createdCount === 0) {
    console.log('⚠️  Services already exist, skipping...');
  } else {
    console.log(`✅ Created ${createdCount} services`);
  }
}
