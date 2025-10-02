import { Injectable } from '@nestjs/common';
import { join } from 'path';

@Injectable()
export class UploadService {
  buildPublicUrl(filename: string) {
    // file được phục vụ tại /static/images/<filename>
    return `/static/images/${filename}`;
  }

  mapFile(file: Express.Multer.File) {
    return {
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      url: this.buildPublicUrl(file.filename),
    };
  }

  mapFiles(files: Express.Multer.File[]) {
    return files.map((f) => this.mapFile(f));
  }
}
