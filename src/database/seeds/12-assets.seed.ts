import { DataSource } from 'typeorm';
import { Asset } from '../../modules/asset/entities/asset.entity';
import { Building } from '../../modules/building/entities/building.entity';
import { Apartment } from '../../modules/apartment/entities/apartment.entity';
import { User } from '../../modules/users/entities/user.entity';

/**
 * Assets Seeding
 * Creates sample assets for buildings and apartments
 */
export async function seedAssets(
  dataSource: DataSource,
  buildings: Building[],
  apartments: Apartment[],
  host?: User,
) {
  console.log('📦 Seeding assets...');

  const assetRepository = dataSource.getRepository(Asset);

  if (buildings.length === 0 && apartments.length === 0) {
    console.log(
      '⚠️  No buildings or apartments found, skipping assets seeding...',
    );
    return [];
  }

  // Common assets for buildings
  const buildingAssets = [
    {
      name: 'Máy lạnh trung tâm',
      brand: 'Daikin',
      value: '50000000',
      quantity: 1,
    },
    { name: 'Thang máy', brand: 'Otis', value: '200000000', quantity: 2 },
    {
      name: 'Hệ thống camera',
      brand: 'Hikvision',
      value: '15000000',
      quantity: 1,
    },
    {
      name: 'Hệ thống báo cháy',
      brand: 'Honeywell',
      value: '10000000',
      quantity: 1,
    },
    { name: 'Máy phát điện', brand: 'Cummins', value: '30000000', quantity: 1 },
  ];

  // Common assets for apartments
  const apartmentAssets = [
    { name: 'Tủ lạnh', brand: 'Samsung', value: '8000000', quantity: 1 },
    { name: 'Máy giặt', brand: 'LG', value: '6000000', quantity: 1 },
    { name: 'Máy lạnh', brand: 'Daikin', value: '12000000', quantity: 2 },
    { name: 'Tivi', brand: 'Sony', value: '10000000', quantity: 1 },
    { name: 'Bàn ghế', brand: 'IKEA', value: '3000000', quantity: 1 },
    { name: 'Giường', brand: 'Everon', value: '5000000', quantity: 1 },
    { name: 'Tủ quần áo', brand: 'IKEA', value: '4000000', quantity: 1 },
  ];

  let createdCount = 0;
  const createdAssets: Asset[] = [];

  // Create assets for buildings
  for (const building of buildings.slice(0, 5)) {
    // Limit to first 5 buildings
    for (const assetData of buildingAssets.slice(0, 3)) {
      // 3 assets per building
      const existing = await assetRepository.findOne({
        where: {
          buildingId: building.id,
          name: assetData.name,
        },
      });

      if (!existing) {
        const asset = assetRepository.create({
          name: assetData.name,
          brand: assetData.brand,
          value: assetData.value,
          quantity: assetData.quantity,
          status: 'available' as const,
          buildingId: building.id,
          createdById: host?.id,
        });
        const saved = await assetRepository.save(asset);
        createdAssets.push(saved);
        createdCount++;
      }
    }
  }

  // Create assets for apartments
  for (const apartment of apartments.slice(0, 10)) {
    // Limit to first 10 apartments
    // Random 2-4 assets per apartment
    const numAssets = Math.floor(Math.random() * 3) + 2;
    const selectedAssets = apartmentAssets
      .sort(() => Math.random() - 0.5)
      .slice(0, numAssets);

    for (const assetData of selectedAssets) {
      const existing = await assetRepository.findOne({
        where: {
          apartmentId: apartment.id,
          name: assetData.name,
        },
      });

      if (!existing) {
        const asset = assetRepository.create({
          name: assetData.name,
          brand: assetData.brand,
          value: assetData.value,
          quantity: assetData.quantity,
          status: 'available' as const,
          apartmentId: apartment.id,
          createdById: host?.id,
        });
        const saved = await assetRepository.save(asset);
        createdAssets.push(saved);
        createdCount++;
      }
    }
  }

  if (createdCount === 0) {
    console.log('⚠️  Assets already exist, skipping...');
  } else {
    console.log(`✅ Created ${createdCount} assets`);
  }

  return createdAssets;
}
