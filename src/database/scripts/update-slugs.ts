import dataSource from '../../data-source';
import { Vehicle } from '../../modules/vehicles/entities/vehicle.entity';
import { ServiceProvider, ServiceProviderStatus } from '../../modules/service-providers/entities/service-provider.entity';
import { Job } from '../../modules/jobs/entities/job.entity';
import { ensureUniqueSlug } from '../../common/helpers/slug.helper';

/**
 * Script để cập nhật slug cho các records đã tồn tại
 * Chạy: npm run ts-node src/database/scripts/update-slugs.ts
 */
async function updateSlugs() {
  console.log('🔄 Updating slugs for existing records...');

  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
      console.log('✅ Database connection established');
    }

    // Update Vehicles
    console.log('\n📦 Updating vehicle slugs...');
    const vehicleRepo = dataSource.getRepository(Vehicle);
    const vehicles = await vehicleRepo.find();
    let vehicleCount = 0;
    for (const vehicle of vehicles) {
      if (!vehicle.slug) {
        const slugBase = vehicle.model || vehicle.plateNumber || `xe-${vehicle.type || 'unknown'}`;
        vehicle.slug = await ensureUniqueSlug(vehicleRepo, slugBase, vehicle.id);
        await vehicleRepo.save(vehicle);
        vehicleCount++;
        console.log(`  ✅ Updated vehicle #${vehicle.id}: ${vehicle.slug}`);
      }
    }
    console.log(`✅ Updated ${vehicleCount} vehicles`);

    // Update Service Providers
    console.log('\n📦 Updating service provider slugs...');
    const providerRepo = dataSource.getRepository(ServiceProvider);
    const providers = await providerRepo.find();
    let providerCount = 0;
    for (const provider of providers) {
      if (!provider.slug) {
        provider.slug = await ensureUniqueSlug(providerRepo, provider.name, provider.id);
        await providerRepo.save(provider);
        providerCount++;
        console.log(`  ✅ Updated provider #${provider.id}: ${provider.slug}`);
      }
    }
    console.log(`✅ Updated ${providerCount} service providers`);

    // Verify active service providers
    console.log('\n📦 Verifying active service providers...');
    const activeProviders = await providerRepo.find({
      where: { status: ServiceProviderStatus.ACTIVE } as any,
    });
    let verifiedCount = 0;
    for (const provider of activeProviders) {
      if (!provider.isVerified) {
        provider.isVerified = true;
        if (!provider.approvalStatus) {
          provider.approvalStatus = 'approved';
        }
        if (provider.isApproved !== true) {
          provider.isApproved = true;
        }
        await providerRepo.save(provider);
        verifiedCount++;
        console.log(`  ✅ Verified provider #${provider.id}: ${provider.name}`);
      }
    }
    if (verifiedCount > 0) {
      console.log(`✅ Verified ${verifiedCount} service providers`);
    } else {
      console.log('✅ All active service providers are already verified');
    }

    // Approve available vehicles
    console.log('\n📦 Approving available vehicles...');
    const availableVehicles = await vehicleRepo.find({
      where: { status: 'available' } as any,
    });
    let approvedVehicleCount = 0;
    for (const vehicle of availableVehicles) {
      // Check if approval_status column exists
      const hasApprovalColumn = await vehicleRepo.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'vehicles' 
        AND COLUMN_NAME = 'approval_status'
      `);

      if (hasApprovalColumn.length > 0) {
        if (!vehicle.approvalStatus || vehicle.approvalStatus !== 'approved') {
          (vehicle as any).approvalStatus = 'approved';
          if ((vehicle as any).isApproved !== true) {
            (vehicle as any).isApproved = true;
          }
          await vehicleRepo.save(vehicle);
          approvedVehicleCount++;
          console.log(`  ✅ Approved vehicle #${vehicle.id}: ${vehicle.model || vehicle.plateNumber}`);
        }
      }
    }
    if (approvedVehicleCount > 0) {
      console.log(`✅ Approved ${approvedVehicleCount} vehicles`);
    } else {
      console.log('✅ All available vehicles are already approved (or approval column does not exist)');
    }

    // Update Jobs - ensure isApproved and status
    console.log('\n📦 Updating job approval status...');
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

    if (hasIsApprovedColumn) {
      const jobs = await jobRepo.find();
      let jobCount = 0;
      for (const job of jobs) {
        let updated = false;
        if (job.status === 'published' && !job.isApproved) {
          job.isApproved = true;
          if (!job.approvalStatus) {
            job.approvalStatus = 'approved';
          }
          updated = true;
        }
        if (updated) {
          await jobRepo.save(job);
          jobCount++;
          console.log(`  ✅ Updated job #${job.id} (${job.slug || job.id}): approved`);
        }
      }
      console.log(`✅ Updated ${jobCount} jobs`);
    } else {
      console.log('⚠️  Column is_approved does not exist. Please run migration first:');
      console.log('   docker-compose exec backend npm run migration:run');
    }

    console.log('\n✅ All slugs and approval statuses updated!');
  } catch (error) {
    console.error('❌ Error updating slugs:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

updateSlugs()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
