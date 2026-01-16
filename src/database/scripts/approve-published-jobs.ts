import dataSource from '../../data-source';
import { Job } from '../../modules/jobs/entities/job.entity';

/**
 * Script để approve tất cả jobs đã published
 * Chạy: npm run ts-node src/database/scripts/approve-published-jobs.ts
 */
async function approvePublishedJobs() {
  console.log('🔄 Approving published jobs...');

  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
      console.log('✅ Database connection established');
    }

    const jobRepo = dataSource.getRepository(Job);
    
    // Check if is_approved column exists
    const table = await jobRepo.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'jobs' 
      AND COLUMN_NAME = 'is_approved'
    `);
    
    const hasIsApprovedColumn = table.length > 0;
    
    if (!hasIsApprovedColumn) {
      console.log('⚠️  Column is_approved does not exist. Please run migration first:');
      console.log('   docker-compose exec backend npm run migration:run');
      return;
    }

    // Find all published jobs that are not approved
    const publishedJobs = await jobRepo.find({
      where: { status: 'published' } as any,
    });

    let updatedCount = 0;
    for (const job of publishedJobs) {
      if (job.isApproved !== true) {
        job.isApproved = true;
        if (!job.approvalStatus) {
          job.approvalStatus = 'approved';
        }
        await jobRepo.save(job);
        updatedCount++;
        console.log(`  ✅ Approved job #${job.id}: ${job.title} (${job.slug})`);
      }
    }

    if (updatedCount === 0) {
      console.log('✅ All published jobs are already approved');
    } else {
      console.log(`\n✅ Updated ${updatedCount} published jobs to approved`);
    }
  } catch (error) {
    console.error('❌ Error approving jobs:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

approvePublishedJobs()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

