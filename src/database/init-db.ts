import dataSource from '../data-source';

/**
 * Database Initialization Script
 *
 * This script creates the database structure using TypeORM synchronize.
 * It will create all tables based on entity definitions.
 *
 * ⚠️ WARNING: This will drop existing tables if they exist!
 *
 * Usage:
 *   npm run db:init
 */

async function initDatabase() {
  console.log('🗄️  Initializing database structure...');
  console.log('⚠️  WARNING: This will drop and recreate all tables!');

  try {
    // Initialize data source
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
      console.log('✅ Database connection established');
    }

    // Drop and recreate all tables
    console.log('🔄 Synchronizing database schema...');
    
    // Drop all existing tables first to avoid index conflicts
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      // Get all table names
      const tables = await queryRunner.query(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_TYPE = 'BASE TABLE'
      `);
      
      // Drop all tables (this will also drop indexes)
      if (tables.length > 0) {
        console.log(`🗑️  Dropping ${tables.length} existing tables...`);
        await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
        for (const table of tables) {
          const tableName = table.TABLE_NAME || table.table_name;
          await queryRunner.query(`DROP TABLE IF EXISTS \`${tableName}\``);
        }
        await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ All existing tables dropped');
      } else {
        console.log('ℹ️  No existing tables to drop');
      }
    } catch (error: any) {
      console.log('⚠️  Error dropping tables (may not exist):', error?.message || error);
    } finally {
      await queryRunner.release();
    }
    
    // Now synchronize to create fresh tables
    await dataSource.synchronize(true);
    console.log('✅ Database structure created successfully!');

    console.log('✅ All tables have been created.');
    console.log('📝 Next step: Run "npm run seed" to populate initial data');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('🎉 Database initialization completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database initialization failed:', error);
      process.exit(1);
    });
}

export { initDatabase };
