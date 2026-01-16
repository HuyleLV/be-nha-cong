import { Injectable } from '@nestjs/common';
import { join, extname } from 'path';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { v4 as uuid } from 'uuid';
import { IStorageProvider, StorageResult, StorageConfig } from './storage.interface';

/**
 * Local File Storage Provider
 * 
 * Stores files on the local filesystem
 */
@Injectable()
export class LocalStorageProvider implements IStorageProvider {
    private basePath: string;
    private baseUrl?: string;

    constructor(config: StorageConfig) {
        this.basePath = config.local?.path || './uploads';
        this.baseUrl = config.local?.baseUrl;
        this.ensureDirectoryExists(this.basePath);
    }

    async upload(file: Express.Multer.File, path?: string): Promise<StorageResult> {
        const subPath = path || 'images';
        const fullPath = join(this.basePath, subPath);
        this.ensureDirectoryExists(fullPath);

        const ext = extname(file.originalname).toLowerCase();
        const filename = `${uuid()}${ext}`;
        const filePath = join(fullPath, filename);

        // Write file to disk
        writeFileSync(filePath, file.buffer);

        const url = this.getUrl(filename, subPath);

        return {
            filename,
            url,
            size: file.size,
            mimetype: file.mimetype,
            path: subPath,
            originalName: file.originalname,
        };
    }

    async uploadMany(files: Express.Multer.File[], path?: string): Promise<StorageResult[]> {
        const results: StorageResult[] = [];
        for (const file of files) {
            const result = await this.upload(file, path);
            results.push(result);
        }
        return results;
    }

    async delete(filename: string, path?: string): Promise<boolean> {
        try {
            const subPath = path || 'images';
            const filePath = join(this.basePath, subPath, filename);

            if (existsSync(filePath)) {
                unlinkSync(filePath);
                return true;
            }
            return false;
        } catch (error) {
            console.error('[LocalStorageProvider] Delete error:', error);
            return false;
        }
    }

    getUrl(filename: string, path?: string): string {
        const subPath = path || 'images';

        // Priority 1: Configured Base URL (e.g. http://localhost:5000 or https://api.domain.com)
        if (this.baseUrl) {
            // Remove trailing slash if present
            const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
            return `${baseUrl}/${subPath}/${filename}`;
        }

        // Priority 2: Default static path
        // Note: We changed ServeStaticModule to serve at /static instead of /api/static
        return `/static/${subPath}/${filename}`;
    }

    async exists(filename: string, path?: string): Promise<boolean> {
        const subPath = path || 'images';
        const filePath = join(this.basePath, subPath, filename);
        return existsSync(filePath);
    }

    private ensureDirectoryExists(dir: string): void {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
    }
}
