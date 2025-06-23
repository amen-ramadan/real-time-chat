import multer, { diskStorage } from 'multer';
import { extname } from 'path';

export const multerConfig = {
  storage: diskStorage({
    destination: './public/uploads',
    filename: (req, file, callback) => {
      callback(null, file.originalname); // أو أي منطق آخر للتسمية
    },
  }),
  limits: {
    fileSize: 1024 * 1024, // 1MB
  },
  fileFilter: (req: any, file: Express.Multer.File, callback: any) => {
    const fileTypes = /jpeg|jpg|png/;
    const mimeType = fileTypes.test(file.mimetype);
    const extName = fileTypes.test(extname(file.originalname).toLowerCase());

    if (mimeType && extName) {
      return callback(null, true);
    }
    callback(new Error('Only image files are allowed!'), false);
  },
};
