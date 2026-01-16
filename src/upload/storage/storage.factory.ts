import { Injectable } from '@nestjs/common';
import { IStorageProvider, StorageConfig } from './storage.interface';
import { LocalStorageProvider } from './local.storage';
import { S3StorageProvider } from './s3.storage';

/**
 * Storage Factory
 * 
 * Creates appropriate storage provider based on configuration
 */
@Injectable()
export class StorageFactory {
    /**
     * Create a storage provider instance based on configuration
     * @param config - Storage configuration
     * @returns Storage provider instance
     */
    static create(config: StorageConfig): IStorageProvider {
        switch (config.type) {
            case 'local':
                return new LocalStorageProvider(config);

            case 's3':
                if (!config.s3) {
                    throw new Error('S3 configuration is required when type is "s3"');
                }
                return new S3StorageProvider(config);

            default:
                console.warn(`[StorageFactory] Unknown storage type: ${config.type}, using local storage`);
                return new LocalStorageProvider(config);
        }
    }

    /**
     * Validate storage configuration
     * @param config - Storage configuration to validate
     * @returns true if valid, throws error if invalid
     */
    static validate(config: StorageConfig): boolean {
        if (!config.type) {
            throw new Error('Storage type is required');
        }

        switch (config.type) {
            case 's3':
                if (!config.s3?.region || !config.s3?.bucket || !config.s3?.accessKeyId || !config.s3?.secretAccessKey) {
                    throw new Error('S3 configuration is incomplete. Required: region, bucket, accessKeyId, secretAccessKey');
                }
                break;
        }

        return true;
    }
}
