/**
 * Legacy Seeding Script (Deprecated)
 *
 * This file is kept for backward compatibility.
 * New seeding is organized in separate files in the seeds/ directory.
 *
 * Use: npm run seed (which now uses seeds/index.ts)
 */

import { seed as seedMain } from './index';

// Re-export and run if called directly
export { seedMain as seed };

if (require.main === module) {
  seedMain()
    .then(() => {
      console.log('🎉 Seeding process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}
