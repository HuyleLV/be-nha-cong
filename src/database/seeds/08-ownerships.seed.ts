import { DataSource } from 'typeorm';
import { Ownership } from '../../modules/ownership/entities/ownership.entity';
import { Building } from '../../modules/building/entities/building.entity';
import { User } from '../../modules/users/entities/user.entity';

/**
 * Ownerships Seeding
 * Creates ownership relationships between users and buildings
 */
export async function seedOwnerships(
  dataSource: DataSource,
  buildings: Building[],
  host?: User,
) {
  console.log('👥 Seeding ownerships...');

  if (!host || buildings.length === 0) {
    console.log('⚠️  Host or buildings not found, skipping ownerships...');
    return;
  }

  const ownershipRepository = dataSource.getRepository(Ownership);

  let createdCount = 0;
  for (const building of buildings) {
    const existing = await ownershipRepository.findOne({
      where: {
        userId: host.id,
        buildingId: building.id,
      },
    });

    if (!existing) {
      const ownership = ownershipRepository.create({
        userId: host.id,
        buildingId: building.id,
        role: 'owner' as const,
      });
      await ownershipRepository.save(ownership);
      createdCount++;
      console.log(`✅ Created ownership for building: ${building.name}`);
    }
  }

  if (createdCount === 0) {
    console.log('⚠️  Ownerships already exist, skipping...');
  } else {
    console.log(`✅ Created ${createdCount} ownership relationships`);
  }
}
