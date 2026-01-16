import dataSource from '../../data-source';
import { seedUsers } from './01-users.seed';
import { seedLocations } from './02-locations.seed';
import { seedLocationsFromCSV } from './02-locations-csv.seed';
import { seedBuildingsAndApartments } from './03-buildings-apartments.seed';
import { seedServices } from './04-services.seed';
import { seedJobs } from './05-jobs.seed';
import { seedBlog } from './06-blog.seed';
import { seedPartners } from './07-partners.seed';
import { seedOwnerships } from './08-ownerships.seed';
import { seedVehicles } from './09-vehicles.seed';
import { seedServiceProviders } from './10-service-providers.seed';
import { seedBeds } from './11-beds.seed';
import { seedAssets } from './12-assets.seed';
import { seedAdvertisements } from './13-advertisements.seed';
import { seedCategories } from './14-categories.seed';

/**
 * Main Seeding Script
 *
 * This script orchestrates all seeders in the correct order
 *
 * Usage:
 *   npm run seed
 */
export async function seed() {
  console.log('🌱 Starting comprehensive database seeding...');

  try {
    // Initialize data source
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
      console.log('✅ Database connection established');
    }

    // Seed in order (respecting dependencies)
    console.log('\n📦 Step 1: Seeding users...');
    const users = await seedUsers(dataSource);

    console.log('\n📦 Step 2: Seeding locations...');
    const locations = await seedLocations(dataSource);

    console.log('\n📦 Step 2b: Seeding locations from CSV (wards)...');
    const csvLocations = await seedLocationsFromCSV(dataSource);

    console.log('\n📦 Step 3: Seeding buildings and apartments...');
    const { buildings, apartments } = await seedBuildingsAndApartments(
      dataSource,
      locations,
      users.host,
    );

    console.log('\n📦 Step 4: Seeding services...');
    await seedServices(dataSource, buildings, users.host);

    console.log('\n📦 Step 5: Seeding jobs...');
    await seedJobs(dataSource);

    console.log('\n📦 Step 6: Seeding blog posts...');
    await seedBlog(dataSource, users.admin);

    console.log('\n📦 Step 7: Seeding partners...');
    await seedPartners(dataSource);

    console.log('\n📦 Step 8: Seeding ownerships...');
    await seedOwnerships(dataSource, buildings, users.host);

    console.log('\n📦 Step 9: Seeding vehicles...');
    const vehicles = await seedVehicles(dataSource, buildings, users.host);

    console.log('\n📦 Step 10: Seeding service providers...');
    const serviceProviders = await seedServiceProviders(
      dataSource,
      locations,
      users.host,
    );

    console.log('\n📦 Step 11: Seeding beds...');
    const beds = await seedBeds(dataSource, apartments, users.host);

    console.log('\n📦 Step 12: Seeding assets...');
    const assets = await seedAssets(
      dataSource,
      buildings,
      apartments,
      users.host,
    );

    console.log('\n📦 Step 13: Seeding advertisements...');
    await seedAdvertisements(dataSource);

    console.log('\n📦 Step 14: Seeding categories...');
    await seedCategories(dataSource);

    console.log('\n✅ All seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: Admin, Host, Customer + additional users`);
    console.log(
      `   - Locations: Hà Nội + ${Object.keys(locations.districts).length} wards (mô hình 2 cấp)`,
    );
    console.log(`   - Buildings: ${buildings.length}`);
    console.log(`   - Apartments: ${apartments.length}`);
    console.log(`   - Services: Multiple common services`);
    console.log(`   - Jobs: 5 job postings`);
    console.log(`   - Blog posts: 5 articles`);
    console.log(`   - Partners: 5 business partners`);
    console.log(
      `   - Vehicles: ${vehicles.length} vehicles (cars & motorbikes)`,
    );
    console.log(
      `   - Service Providers: ${serviceProviders.length} service providers`,
    );
    console.log(`   - Beds: ${beds.length} beds`);
    console.log(`   - Assets: ${assets.length} assets`);
    console.log(`   - Advertisements: Multiple ads for homepage, footer, detail pages, popup`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('🎉 Seeding process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}
