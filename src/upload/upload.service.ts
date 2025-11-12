import { Injectable } from '@nestjs/common';
import { join } from 'path';

@Injectable()
export class UploadService {
  buildPublicImageUrl(filename: string) {
    // file được phục vụ tại /static/images/<filename>
    return `/static/images/${filename}`;
  }

  buildPublicVideoUrl(filename: string) {
    // video được phục vụ tại /static/videos/<filename>
    return `/static/videos/${filename}`;
  }

  buildPublicDocUrl(filename: string) {
    // cv được phục vụ tại /static/docs/<filename>
    return `/static/docs/${filename}`;
  }

  mapFile(file: Express.Multer.File) {
    // Back-compat image mapping
    return {
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      url: this.buildPublicImageUrl(file.filename),
    };
  }

  mapFiles(files: Express.Multer.File[]) {
    return files.map((f) => this.mapFile(f));
  }

  mapVideoFile(file: Express.Multer.File) {
    return {
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      url: this.buildPublicVideoUrl(file.filename),
    };
  }

  mapVideoFiles(files: Express.Multer.File[]) {
    return files.map((f) => this.mapVideoFile(f));
  }

  mapDocFile(file: Express.Multer.File) {
    return {
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      url: this.buildPublicDocUrl(file.filename),
    };
  }
}
