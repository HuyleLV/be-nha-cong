import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { multerImageOptions, multerVideoOptions, multerDocOptions } from './upload.config';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly service: UploadService) {}

  // Upload 1 ảnh: field name = "file"
  @Post('image')
  @UseInterceptors(FileInterceptor('file', multerImageOptions))
  uploadOne(@UploadedFile() file: Express.Multer.File) {
    return this.service.mapFile(file);
  }

  // Upload nhiều ảnh: field name = "files"
  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10, multerImageOptions))
  uploadMany(@UploadedFiles() files: Express.Multer.File[]) {
    return this.service.mapFiles(files);
  }

  // Upload 1 video: field name = "file"
  @Post('video')
  @UseInterceptors(FileInterceptor('file', multerVideoOptions))
  uploadVideo(@UploadedFile() file: Express.Multer.File) {
    return this.service.mapVideoFile(file);
  }

  // Upload 1 CV/document: field name = "file"
  @Post('file')
  @UseInterceptors(FileInterceptor('file', multerDocOptions))
  uploadDoc(@UploadedFile() file: Express.Multer.File) {
    return this.service.mapDocFile(file);
  }
}
  