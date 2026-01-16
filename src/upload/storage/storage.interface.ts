/**
 * Storage Provider Interface
 * 
 * Defines the contract for all storage providers (Local, S3, Spaces, FTP, CDN)
 */
export interface IStorageProvider {
    /**
     * Upload a single file
     * @param file - Multer file object
     * @param path - Optional subdirectory path (e.g., 'images', 'videos', 'docs')
     * @returns StorageResult with file information and public URL
     */
    upload(file: Express.Multer.File, path?: string): Promise<StorageResult>;

    /**
     * Upload multiple files
     * @param files - Array of Multer file objects
     * @param path - Optional subdirectory path
     * @returns Array of StorageResult
     */
    uploadMany(files: Express.Multer.File[], path?: string): Promise<StorageResult[]>;

    /**
     * Delete a file
     * @param filename - Name of the file to delete
     * @param path - Optional subdirectory path
     * @returns true if deleted successfully, false otherwise
     */
    delete(filename: string, path?: string): Promise<boolean>;

    /**
     * Get public URL for a file
     * @param filename - Name of the file
     * @param path - Optional subdirectory path
     * @returns Public URL string
     */
    getUrl(filename: string, path?: string): string;

    /**
     * Check if a file exists
     * @param filename - Name of the file
     * @param path - Optional subdirectory path
     * @returns true if file exists, false otherwise
     */
    exists(filename: string, path?: string): Promise<boolean>;
}

/**
 * Result returned after uploading a file
 */
export interface StorageResult {
    filename: string;
    url: string;
    size: number;
    mimetype: string;
    path?: string;
    originalName?: string;
}

/**
 * Storage configuration
 */
export interface StorageConfig {
    type: 'local' | 's3' | 'spaces' | 'ftp' | 'cdn';
    local?: {
        path: string;
        baseUrl?: string;
    };
    s3?: {
        region: string;
        bucket: string;
        accessKeyId: string;
        secretAccessKey: string;
        cdnUrl?: string;
    };
    spaces?: {
        endpoint: string;
        bucket: string;
        key: string;
        secret: string;
        cdnUrl?: string;
    };
    ftp?: {
        host: string;
        port: number;
        user: string;
        password: string;
        basePath: string;
        baseUrl?: string;
    };
    cdn?: {
        provider: string;
        url: string;
        apiKey?: string;
    };
}
