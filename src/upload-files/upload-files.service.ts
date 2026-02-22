import {
  BadRequestException,
  Injectable,
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
import crypto from 'crypto';
import { encode } from 'blurhash';
import { fileTypeFromBuffer } from 'file-type';
import { VariantType } from '@db/__generated__/enums';
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
          include: { variants: true },
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
        );
        const absolutePath = path.join(process.cwd(), filePath);

        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
        await fs.writeFile(absolutePath, file.buffer);

        // file info
        const stats = await fs.stat(absolutePath);
        const metadata = await sharp(file.buffer).metadata();

        // collect uploaded file data
        const data = {
          originalname: file.originalname.split('.').at(0),
          extension: extension ?? '',
          mimeType: file.mimetype,
          size: stats.size,
          width: metadata.width,
          height: metadata.height,
          checksum,
          filePath: filePath,
          folderId,
          userId,
          // variants: {
          //   create: [
          //     {
          //       type: VariantType.ORIGINAL,
          //       filePath: filePath,
          //       format: extension ?? '',
          //       size: +stats.size,
          //     },
          //   ],
          // },
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
          await this.createImageVariants({
            tx,
            file: originFile,
            buffer: file.buffer,
            metadata,
            fileNameUUID,
          });
        }

        results.push(originFile);
      }

      return results;
    });
  }
  async findAll(): Promise<Files[]> {
    return this.prismaService.files.findMany({
      take: 10,
      skip: 0,
      include: { variants: true },
    });
  }

  async findOne(id: string): Promise<Files> {
    const file = await this.prismaService.files.findUnique({
      where: { id },
      include: { variants: true },
    });
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
      include: { variants: true },
    });

    if (!file) {
      throw new NotFoundException(`File not found.`);
    }

    const variantPaths = file.variants?.map((v) => v.filePath) ?? [];
    const filePathList = [file.filePath, ...variantPaths].filter(Boolean);

    for (const file of filePathList) {
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
      }
    }

    await this.prismaService.files.delete({ where: { id } });

    return {
      message: `File with id=${id} has been deleted.`,
    };
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

  private getFilePath(filePath): string {
    return path.join(process.cwd(), filePath);
  }

  private generateFilePath(
    fileType: string,
    fileNameUUID: string,
    extension: string,
    variantType?: VariantType,
  ): string {
    let path = `uploads/${fileType}/${fileNameUUID}`;

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

  private async createImageVariants({
    tx,
    file,
    buffer,
    metadata,
    fileNameUUID,
  }) {
    const sizes = [
      { type: VariantType.ORIGINAL, width: metadata.width },
      { type: VariantType.THUMBNAIL, width: 150 },
      { type: VariantType.SMALL, width: 400 },
      { type: VariantType.MEDIUM, width: 800 },
      { type: VariantType.LARGE, width: 1200 },
    ];

    for (const variant of sizes) {
      // dont create redundant thumbnails fot tiny files
      if (variant.width > metadata.width) continue;

      const pipeline = sharp(buffer)
        .clone()
        .resize({ width: variant.width, withoutEnlargement: true })
        .webp({ quality: 82 });

      const resizedMeta = await pipeline.metadata();
      const resized = await pipeline.toBuffer();

      const filePath = this.generateFilePath(
        IMAGE_FILE_TYPE,
        fileNameUUID,
        WEBP_EXTENSION,
        variant.type,
      );

      const absolutePath = path.join(process.cwd(), filePath);
      await fs.writeFile(absolutePath, resized);

      const data = {
        fileId: file.id,
        type: variant.type,
        format: WEBP_EXTENSION,

        width: resizedMeta.width || variant.width,
        height: resizedMeta.height,
        size: resized.length,
        filePath,
      };
      await tx.fileVariants.create({ data });
    }
  }
}
