export class MFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  filename: string;

  constructor(file: Express.Multer.File | MFile) {
    this.buffer = file.buffer;
    this.mimetype = file.mimetype;
    this.originalname = file.originalname;
    this.filename = file.filename;
  }
}
