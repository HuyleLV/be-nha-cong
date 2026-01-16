import dataSource from '../../data-source';
import { seed } from './index'; // Updated import to point to index.ts

/**
 * Refresh Seed Script
 *
 * This script drops all data and reseeds the database.
 * ⚠️ WARNING: This will delete all existing data!
 *
 * Usage:
 *   npm run seed:refresh
 */

async function refreshSeed() {
  console.log('🔄 Starting database refresh and seeding...');
  console.log('⚠️  WARNING: This will delete all existing data!');

  try {
    // Initialize data source
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
      console.log('✅ Database connection established');
    }

    // Drop all tables (via synchronize)
    console.log('🗑️  Dropping all tables...');
    await dataSource.synchronize(true);
    console.log('✅ All tables dropped and recreated');

    // Run migrations first (if any)
    try {
      console.log('🔄 Running migrations...');
      await dataSource.runMigrations();
      console.log('✅ Migrations completed');
    } catch (error: any) {
      console.log(
        '⚠️  No migrations to run or migration error:',
        error.message,
      );
    }

    // Seed data
    await seed();

    console.log('✅ Refresh seeding completed successfully!');
  } catch (error) {
    console.error('❌ Refresh seeding failed:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Run refresh seed if called directly
if (require.main === module) {
  refreshSeed()
    .then(() => {
      console.log('🎉 Refresh seeding process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Refresh seeding process failed:', error);
      process.exit(1);
    });
}

export { refreshSeed };
