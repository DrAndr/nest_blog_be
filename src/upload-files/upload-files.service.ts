import {
  BadRequestException,
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
import type { Files, Folders } from '@db/__generated__/client';
import { UploadFile } from '@/upload-files/entities/upload-file.entity';
import argon2 from 'argon2';
import crypto from 'crypto';
import { encode } from 'blurhash';
import { Prisma } from '@prisma/client';
import { fileTypeFromBuffer } from 'file-type';
import { VariantType } from '@db/__generated__/enums';
// import { Prisma } from '@prisma/client/extension';
import Extension = Prisma.Extension;
import { IMAGE_FILE_TYPE, WEBP_EXTENSION } from '@/upload-files/libs/constants';

@Injectable()
export class UploadFilesService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
  ) {}

  async create(fileData: MFile[], userId: string, folderId?: string) {
    return this.prismaService.$transaction(async (tx) => {
      const results: Files[] = [];

      for (const file of fileData) {
        const checksum = this.createChecksum(file.buffer);
        const fileType = file.mimetype.split('/').at(0) ?? '';
        const isImage = fileType?.toLocaleLowerCase() === IMAGE_FILE_TYPE;

        // Check duplication
        const existing = await tx.files.findFirst({
          where: { checksum },
        });

        // if file exist
        if (existing) {
          results.push(existing);
          continue;
        }

        const fileNameUUID: string = uuid();
        const extension: string = await this.getExtension(file);
        const filePath: string = this.generateFilePath(
          fileType,
          fileNameUUID,
          extension,
          VariantType.ORIGINAL,
        );
        const absolutePath = path.join(process.cwd(), filePath);

        console.log('filePath', filePath);
        console.log('absolutePath', absolutePath);

        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
        await fs.writeFile(absolutePath, file.buffer);

        // file info
        const stats = await fs.stat(absolutePath);

        // collect uploaded file data
        const data = {
          originalname: file.filename,
          extension: extension ?? '',
          mimeType: file.mimetype,
          size: stats.size,
          checksum,
          storageKey: filePath,
          folderId,
          userId,
          variants: {
            create: [
              {
                type: VariantType.ORIGINAL,
                storageKey: filePath,
                format: extension ?? '',
                size: +stats.size,
              },
            ],
          },
        };

        if (isImage) {
          data['blurhash'] = await this.generateBlurhash(file.buffer);
          data['dominantColor'] = await this.extractDominantColor(file.buffer);
        }

        const originFile = await tx.files.create({
          data,
          include: { variants: true },
        });

        // Create variants
        if (isImage) {
          await this.createImageVariants(
            tx,
            originFile,
            file.buffer,
            fileNameUUID,
          );
        }

        results.push(originFile);
      }

      return results;
    });
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
      const filePath = this.getFilePath(file);
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

  private convertToWebp(file: Buffer): Promise<Buffer> {
    return sharp(file).webp().toBuffer();
  }

  private async getExtension(file: MFile): Promise<string> {
    const extension = await fileTypeFromBuffer(file.buffer);
    if (!extension) {
      throw new BadRequestException('File extension undefined');
    }
    return extension.ext;
  }

  private getFilePath(fileUrl): string {
    return path.join(process.cwd(), fileUrl);
  }

  private generateFilePath(
    fileType: string,
    fileNameUUID: string,
    extension: string,
    variantType?: VariantType,
  ): string {
    let path = `dist/uploads/${fileType}/${fileNameUUID}`;

    if (variantType) {
      path += `_${variantType}`;
    }

    path += `.${extension}`;

    return path;
  }

  private createChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private async extractDominantColor(buffer: Buffer): Promise<string | null> {
    const { dominant } = await sharp(buffer).stats();
    return `rgb(${dominant.r},${dominant.g},${dominant.b})`;
  }

  private async generateBlurhash(buffer: Buffer): Promise<string | null> {
    const { data, info } = await sharp(buffer)
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' })
      .toBuffer({ resolveWithObject: true });

    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
  }

  private async createImageVariants(
    tx: Prisma.TransactionClient,
    file: Files,
    buffer: Buffer,
    fileNameUUID,
  ) {
    const sizes = [
      { type: VariantType.THUMBNAIL, width: 150 },
      { type: VariantType.SMALL, width: 400 },
      { type: VariantType.MEDIUM, width: 800 },
      { type: VariantType.LARGE, width: 1200 },
    ];

    for (const variant of sizes) {
      const resized = await sharp(buffer)
        .resize({ width: variant.width })
        .webp()
        .toBuffer();

      const storageKey = this.generateFilePath(
        IMAGE_FILE_TYPE,
        fileNameUUID,
        WEBP_EXTENSION,
        variant.type,
      );

      const absolutePath = path.join(process.cwd(), storageKey);

      await fs.writeFile(absolutePath, resized);

      await tx.fileVariants.create({
        data: {
          fileId: file.id,
          type: variant.type as any,
          storageKey,
          format: WEBP_EXTENSION,
          width: variant.width,
          size: resized.length,
        },
      });
    }
  }
}
