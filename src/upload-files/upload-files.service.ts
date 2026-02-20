import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { UpdateFileDto } from './dto/update-file.dto';
import { PrismaService } from '@/infrastructure/prisma-provider/prisma.service';
import { UserService } from '@/user/user.service';
import { isFileExists } from '@/upload-files/libs/utils/isFileExists';
import { IServiceResponse } from '@/libs/interfaces';
import sharp from 'sharp';
import { MFile } from '@/upload-files/libs/MFile';
import { Files } from '@db/__generated__/client';
import { UploadFile } from '@/upload-files/entities/upload-file.entity';

@Injectable()
export class UploadFilesService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
  ) {}

  async create(
    fileData: MFile[],
    userId: string,
    folder = '',
  ): Promise<File[]> {
    console.log('fileData', fileData);

    const isSingle = !Array.isArray(fileData);
    const filteredFiles: MFile[] = await this.fileFilter(
      isSingle ? [fileData] : fileData,
    );
    console.log('filteredFiles', filteredFiles);

    const uploadFolder: string = path.join(
      __dirname,
      '..',
      '..',
      'uploads',
      folder,
    );
    console.log('uploadFolder', uploadFolder);
    // create folder if not exists
    await fs.mkdir(uploadFolder, { recursive: true });

    return await Promise.all(
      filteredFiles.map(async (file: MFile): Promise<any> => {
        try {
          const filePath = path.join(uploadFolder, file.originalname);
          await fs.writeFile(filePath, file.buffer);
          const stats = await fs.stat(filePath);

          const fileData = {
            url: path.join('uploads', folder, file.originalname),
            name: file.originalname,
            mimetype: file.mimetype,
            origin: file?.filename || '',
            userId,
            meta: JSON.stringify({
              size: stats.size,
              //TODO add other important things file resolution...
            }),
          };

          try {
            return await this.prismaService.files.create({ data: fileData });
          } catch (e) {
            console.error(e);
          }
        } catch (e) {
          throw new InternalServerErrorException(
            `ERROR while file recording: ${e}`,
          );
        }
      }),
    );
  }

  async findAll(): Promise<Files[]> {
    return await this.prismaService.files.findMany({ take: 10, skip: 0 });
  }

  async findOne(id: string): Promise<Files> {
    const file = await this.prismaService.files.findUnique({ where: { id } });
    if (!file) {
      throw new NotFoundException(`File not found, ID: ${id}`);
    }

    return file;
  }

  async update(id: string, updateFileDto: UpdateFileDto): Promise<UploadFile> {
    const updatedFile = this.prismaService.files.update({
      where: { id },
      data: updateFileDto,
    });

    if (!updatedFile) {
      throw new NotFoundException(`Error while updating file: ${id}`);
    }

    return updatedFile;
  }

  async remove(id: string): Promise<IServiceResponse> {
    const file = await this.prismaService.files.findUnique({
      where: { id },
    });

    if (file) {
      const filePath = this.getFilePath(file.url);
      const isFileExist = await isFileExists(filePath);

      if (isFileExist) {
        try {
          await fs.unlink(filePath);
        } catch (_) {
          throw new NotFoundException(`File not exists: ${filePath}`);
        }
      }

      await this.prismaService.files.delete({ where: { id } });
      return {
        message: `File with id=${id} has been deleted.`,
      };
    }
    throw new NotFoundException(`File not found: ${id}`);
  }

  private async fileFilter(files: MFile[]): Promise<MFile[]> {
    return await Promise.all(
      files.map(async (file) => {
        const mimetype = file.mimetype;
        const fileType = mimetype.split('/').at(-1);
        const hashName = uuid();
        const [fileOriginalName, type] = file.originalname.split('.');

        if (
          mimetype.includes('image') &&
          fileType?.toLowerCase() !== 'svg+xml'
        ) {
          const buffer = await this.convertToWebp(file.buffer);
          return new MFile({
            buffer,
            originalname: `${hashName}.webp`,
            filename: fileOriginalName,
            mimetype: `image/webp`,
          });
        }

        return new MFile({
          buffer: file.buffer,
          originalname: `${hashName}.${type}`,
          filename: fileOriginalName,
          mimetype,
        });
      }),
    );
  }

  private convertToWebp(file: Buffer): Promise<Buffer> {
    return sharp(file).webp().toBuffer();
  }

  private getFilePath(fileUrl): string {
    return path.join(__dirname, '..', '..', fileUrl);
  }
}
