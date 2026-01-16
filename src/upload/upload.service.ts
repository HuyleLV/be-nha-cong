import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageProvider, StorageResult } from './storage/storage.interface';
import { StorageFactory } from './storage/storage.factory';

/**
 * Upload Service
 * 
 * Handles file uploads using configured storage provider
 */
@Injectable()
export class UploadService {
  private storageProvider: IStorageProvider;

  constructor(
    @Inject(ConfigService) private configService: ConfigService,
  ) {
    const storageConfig = this.configService.get('storage');
    // Basic validation to ensure config exists
    if (!storageConfig) {
      console.warn('Storage config not found, falling back to local defaults');
      this.storageProvider = StorageFactory.create({ type: 'local', local: { path: './uploads' } });
    } else {
      StorageFactory.validate(storageConfig);
      this.storageProvider = StorageFactory.create(storageConfig);
    }
  }

  /**
   * Upload a single image file
   */
  async uploadImage(file: Express.Multer.File): Promise<StorageResult> {
    return await this.storageProvider.upload(file, 'images');
  }

  /**
   * Upload multiple image files
   */
  async uploadImages(files: Express.Multer.File[]): Promise<StorageResult[]> {
    return await this.storageProvider.uploadMany(files, 'images');
  }

  /**
   * Upload a single video file
   */
  async uploadVideo(file: Express.Multer.File): Promise<StorageResult> {
    return await this.storageProvider.upload(file, 'videos');
  }

  /**
   * Upload a single document file
   */
  async uploadDoc(file: Express.Multer.File): Promise<StorageResult> {
    return await this.storageProvider.upload(file, 'docs');
  }

  /**
   * Build public URL for image
   */
  buildPublicImageUrl(filename: string): string {
    return this.storageProvider.getUrl(filename, 'images');
  }

  /**
   * Build public URL for video
   */
  buildPublicVideoUrl(filename: string): string {
    return this.storageProvider.getUrl(filename, 'videos');
  }

  /**
   * Build public URL for document
   */
  buildPublicDocUrl(filename: string): string {
    return this.storageProvider.getUrl(filename, 'docs');
  }

  /**
   * Delete a file
   */
  async deleteFile(filename: string, type: 'image' | 'video' | 'doc'): Promise<boolean> {
    const path = this.getPathForType(type);
    return await this.storageProvider.delete(filename, path);
  }

  /**
   * Check if file exists
   */
  async fileExists(filename: string, type: 'image' | 'video' | 'doc'): Promise<boolean> {
    const path = this.getPathForType(type);
    return await this.storageProvider.exists(filename, path);
  }

  /**
   * Backward compatibility: Map file (for local storage with multer diskStorage)
   */
  mapFile(file: Express.Multer.File) {
    // If file has already been processed by storage provider (e.g. via interceptor?), use it.
    // But usually UploadService methods are called manually.
    // If this method is used just to transform a Multer file object to DTO, we should try to generate the URL.

    // Check if it's already a full URL or just filename
    const url = this.buildPublicImageUrl(file.filename);

    return {
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      url: url,
    };
  }

  /**
   * Backward compatibility: Map multiple files
   */
  mapFiles(files: Express.Multer.File[]) {
    return files.map((f) => this.mapFile(f));
  }

  /**
   * Backward compatibility: Map video file
   */
  mapVideoFile(file: Express.Multer.File) {
    const url = this.buildPublicVideoUrl(file.filename);
    return {
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      url: url,
    };
  }

  /**
   * Backward compatibility: Map multiple video files
   */
  mapVideoFiles(files: Express.Multer.File[]) {
    return files.map((f) => this.mapVideoFile(f));
  }

  /**
   * Backward compatibility: Map document file
   */
  mapDocFile(file: Express.Multer.File) {
    const url = this.buildPublicDocUrl(file.filename);
    return {
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      url: url,
    };
  }

  /**
   * Get path for file type
   */
  private getPathForType(type: 'image' | 'video' | 'doc'): string {
    return type === 'image' ? 'images' : type === 'video' ? 'videos' : 'docs';
  }
}
