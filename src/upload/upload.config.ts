import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';
import { Request } from 'express';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';

const IMAGE_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

export const ensureUploadDirs = () => {
  const dir = join(process.cwd(), 'uploads', 'images');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

export const multerImageOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      const dir = ensureUploadDirs();
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const safeExt = extname(file.originalname).toLowerCase(); // .jpg/.png...
      const filename = `${uuid()}${safeExt}`;
      cb(null, filename);
    },
  }),
  fileFilter: (req: Request, file: Express.Multer.File, cb: Function) => {
    if (!IMAGE_MIMES.includes(file.mimetype)) {
      return cb(new BadRequestException('Chỉ cho phép ảnh: jpg, png, webp, gif, svg'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10,                 // tối đa 10 file/lần
  },
};
