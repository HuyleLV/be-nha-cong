import { DataSource } from 'typeorm';
import { Bed } from '../../modules/bed/entities/bed.entity';
import { Apartment } from '../../modules/apartment/entities/apartment.entity';
import { User } from '../../modules/users/entities/user.entity';

/**
 * Beds Seeding
 * Creates sample beds for apartments
 */
export async function seedBeds(
  dataSource: DataSource,
  apartments: Apartment[],
  host?: User,
) {
  console.log('🛏️  Seeding beds...');

  const bedRepository = dataSource.getRepository(Bed);

  if (apartments.length === 0) {
    console.log('⚠️  No apartments found, skipping beds seeding...');
    return [];
  }

  const bedTypes = [
    'Giường đơn',
    'Giường đôi',
    'Giường tầng',
    'Giường nệm',
    'Giường gỗ',
  ];

  let createdCount = 0;
  const createdBeds: Bed[] = [];

  // Create beds for each apartment
  for (const apartment of apartments.slice(0, 10)) {
    // Limit to first 10 apartments
    // Random number of beds per apartment (1-4)
    const numBeds = Math.floor(Math.random() * 4) + 1;

    for (let i = 0; i < numBeds; i++) {
      const bedType = bedTypes[Math.floor(Math.random() * bedTypes.length)];
      const rentPrice = (
        Math.floor(Math.random() * 2000000) + 1000000
      ).toString(); // 1-3M VND
      const depositAmount = (
        Math.floor(Math.random() * 1000000) + 500000
      ).toString(); // 0.5-1.5M VND

      const existing = await bedRepository.findOne({
        where: {
          apartmentId: apartment.id,
          name: `${bedType} ${i + 1}`,
        },
      });

      if (!existing) {
        const bed = bedRepository.create({
          name: `${bedType} ${i + 1}`,
          rentPrice,
          depositAmount,
          apartmentId: apartment.id,
          status: 'active' as const,
          createdById: host?.id,
        });
        const saved = await bedRepository.save(bed);
        createdBeds.push(saved);
        createdCount++;
      }
    }
  }

  if (createdCount === 0) {
    console.log('⚠️  Beds already exist, skipping...');
  } else {
    console.log(`✅ Created ${createdCount} beds`);
  }

  return createdBeds;
}
