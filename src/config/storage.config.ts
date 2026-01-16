import { registerAs } from '@nestjs/config';

/**
 * Storage Configuration
 * 
 * Loads storage configuration from environment variables
 */
export default registerAs('storage', () => {
    const type = (process.env.STORAGE_TYPE || 'local') as 'local' | 's3' | 'spaces' | 'ftp' | 'cdn';

    return {
        type,
        local: {
            path: process.env.STORAGE_LOCAL_PATH || './uploads',
            baseUrl: process.env.STORAGE_LOCAL_BASE_URL,
        },
        s3: {
            region: process.env.STORAGE_S3_REGION,
            bucket: process.env.STORAGE_S3_BUCKET,
            accessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY,
            cdnUrl: process.env.STORAGE_S3_CDN_URL,
        },
        spaces: {
            endpoint: process.env.STORAGE_SPACES_ENDPOINT,
            bucket: process.env.STORAGE_SPACES_BUCKET,
            key: process.env.STORAGE_SPACES_KEY,
            secret: process.env.STORAGE_SPACES_SECRET,
            cdnUrl: process.env.STORAGE_SPACES_CDN_URL,
        },
        ftp: {
            host: process.env.STORAGE_FTP_HOST,
            port: parseInt(process.env.STORAGE_FTP_PORT || '21', 10),
            user: process.env.STORAGE_FTP_USER,
            password: process.env.STORAGE_FTP_PASSWORD,
            basePath: process.env.STORAGE_FTP_BASE_PATH || '/uploads',
            baseUrl: process.env.STORAGE_FTP_BASE_URL,
        },
        cdn: {
            provider: process.env.STORAGE_CDN_PROVIDER,
            url: process.env.STORAGE_CDN_URL,
            apiKey: process.env.STORAGE_CDN_API_KEY,
        },
    };
});
