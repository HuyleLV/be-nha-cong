import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import { IStorageProvider, StorageResult, StorageConfig } from './storage.interface';

/**
 * AWS S3 Storage Provider
 * 
 * Stores files on AWS S3
 */
@Injectable()
export class S3StorageProvider implements IStorageProvider {
    private s3Client: S3Client;
    private bucket: string;
    private region: string;
    private cdnUrl?: string;

    constructor(config: StorageConfig) {
        if (!config.s3) {
            throw new Error('S3 configuration is required');
        }

        this.bucket = config.s3.bucket;
        this.region = config.s3.region;
        this.cdnUrl = config.s3.cdnUrl;

        this.s3Client = new S3Client({
            region: this.region,
            credentials: {
                accessKeyId: config.s3.accessKeyId,
                secretAccessKey: config.s3.secretAccessKey,
            },
        });
    }

    async upload(file: Express.Multer.File, path?: string): Promise<StorageResult> {
        const subPath = path || 'images';
        const ext = extname(file.originalname).toLowerCase();
        const filename = `${uuid()}${ext}`;
        const key = `${subPath}/${filename}`;

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read', // Make files publicly accessible
        });

        await this.s3Client.send(command);

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
            const key = `${subPath}/${filename}`;

            const command = new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });

            await this.s3Client.send(command);
            return true;
        } catch (error) {
            console.error('[S3StorageProvider] Delete error:', error);
            return false;
        }
    }

    getUrl(filename: string, path?: string): string {
        if (this.cdnUrl) {
            const subPath = path || 'images';
            return `${this.cdnUrl}/${subPath}/${filename}`;
        }

        // Default S3 URL
        const subPath = path || 'images';
        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${subPath}/${filename}`;
    }

    async exists(filename: string, path?: string): Promise<boolean> {
        try {
            const subPath = path || 'images';
            const key = `${subPath}/${filename}`;

            const command = new HeadObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });

            await this.s3Client.send(command);
            return true;
        } catch (error) {
            return false;
        }
    }
}
