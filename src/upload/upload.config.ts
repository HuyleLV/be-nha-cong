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

// ====== VIDEO CONFIG ======
const VIDEO_MIMES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime', // .mov
];

export const ensureVideoUploadDirs = () => {
  const dir = join(process.cwd(), 'uploads', 'videos');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

// ====== DOCUMENT CONFIG (CV) ======
const DOC_MIMES = [
  'application/pdf', // pdf
  'application/msword', // doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
];

export const ensureDocUploadDirs = () => {
  const dir = join(process.cwd(), 'uploads', 'docs');
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

export const multerVideoOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      const dir = ensureVideoUploadDirs();
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const safeExt = extname(file.originalname).toLowerCase(); // .mp4/.webm...
      const filename = `${uuid()}${safeExt}`;
      cb(null, filename);
    },
  }),
  fileFilter: (req: Request, file: Express.Multer.File, cb: Function) => {
    if (!VIDEO_MIMES.includes(file.mimetype)) {
      return cb(new BadRequestException('Chỉ cho phép video: mp4, webm, ogg, mov'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
    files: 1,
  },
};

export const multerDocOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      const dir = ensureDocUploadDirs();
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const safeExt = extname(file.originalname).toLowerCase(); // .pdf/.doc/.docx
      const filename = `${uuid()}${safeExt}`;
      cb(null, filename);
    },
  }),
  fileFilter: (req: Request, file: Express.Multer.File, cb: Function) => {
    if (!DOC_MIMES.includes(file.mimetype)) {
      return cb(new BadRequestException('Chỉ cho phép file PDF, DOC, DOCX'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB CV max
    files: 1,
  },
};
