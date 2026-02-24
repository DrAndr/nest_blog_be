import {
  BadRequestException,
  Inject,
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
import { Files, Folders, Prisma } from '@db/__generated__/client';
import { UploadFile } from '@/upload-files/entities/upload-file.entity';
import crypto from 'crypto';
import { encode } from 'blurhash';
import fileTypeFromBuffer from 'file-type';
import { VariantType } from '@db/__generated__/enums';
import { IMAGE_FILE_TYPE, WEBP_EXTENSION } from '@/upload-files/libs/constants';
import { contains } from 'class-validator';
import { TFindFilesResponse } from '@/upload-files/libs/types/find-files-response.type';

@Injectable()
export class UploadFilesService {
  public constructor(private readonly prismaService: PrismaService) {}

  /**
   * To add new file
   * @param files
   * @param userId
   * @param folderId
   */
  async create(files: MFile[], userId: string, folderId?: string) {
    return this.prismaService.$transaction(async (tx) => {
      const results: Files[] = [];

      for (const file of files) {
        const checksum = this.createChecksum(file.buffer);

        // Prevent duplicate file uploads
        const existing = await this.checkByCheckSum(tx, checksum);
        if (existing) {
          results.push(existing);
          continue;
        }

        const savedFile = await this.processAndStoreFile({
          tx,
          file,
          checksum,
          userId,
          folderId,
        });

        results.push(savedFile);
      }

      return results;
    });
  }

  /**
   * Select multiple files
   * Filter handler doc: https://github.com/chax-at/prisma-filter?tab=readme-ov-file
   */
  async findAll(filterParams: Prisma.FilesFindManyArgs): Promise<Files[]> {
    return this.prismaService.files.findMany({
      ...filterParams,
      include: { variants: true },
    });
  }

  /**
   * Find single file by file ID
   * @param id
   */
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

  /**
   * Update file meta
   * @param id
   * @param updateFileDto
   */
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

  /**
   * Bulk file removal
   * @param id
   */
  async remove(id: string | string[]): Promise<IServiceResponse> {
    const ids = this.normalizeIds(id);

    const files = await this.findFilesOrThrow(ids);

    if (!files || !files.length) {
      throw new NotFoundException(`Files not found`);
    }

    const filePaths = files.flatMap((file) => this.collectFilePaths(file));

    await this.deletePhysicalFiles(filePaths);

    const response = await this.prismaService.files.deleteMany({
      where: { id: { in: ids } },
    });

    return {
      message: `${response.count} file(s) deleted.`,
    };
  }

  /**
   * Normalizes single id or array of ids into string[]
   */
  private normalizeIds(id: string | string[]): string[] {
    if (Array.isArray(id)) {
      if (!id.length) {
        throw new BadRequestException('Ids array cannot be empty');
      }

      return id;
    }

    if (!id.trim().length) {
      throw new BadRequestException('Id must not be empty');
    }

    return [id];
  }

  /**
   * Checks if file with the same checksum already exists
   */
  private async checkByCheckSum(tx, checksum: string): Promise<Files | null> {
    return tx.files.findFirst({
      where: { checksum },
      include: { variants: true },
    });
  }

  /**
   * Handles full lifecycle of file processing:
   * - saves original file
   * - extracts metadata
   * - stores DB record
   * - generates image variants (if needed)
   */
  private async processAndStoreFile({ tx, file, checksum, userId, folderId }) {
    const fileType = this.getFileType(file.mimetype);
    const isImage = fileType === IMAGE_FILE_TYPE;

    const fileNameUUID = uuid();
    const extension = await this.getExtension(file);

    const filePath = this.generateFilePath(fileType, fileNameUUID, extension);

    await this.savePhysicalFile(filePath, file.buffer);

    const metadata = await sharp(file.buffer).metadata();

    const fileData = await this.buildFileEntityData({
      file,
      filePath,
      extension,
      metadata,
      checksum,
      userId,
      folderId,
      isImage,
    });

    const createdFile = await tx.files.create({
      data: fileData,
      include: { variants: true },
    });

    if (isImage) {
      await this.createImageVariants({
        tx,
        file: createdFile,
        buffer: file.buffer,
        metadata,
        fileNameUUID,
      });
    }

    return createdFile;
  }

  /**
   * Collects original file and all variant paths
   * @param file
   * @private
   */
  private collectFilePaths(file: Files & { variants: any[] }): string[] {
    const variantPaths = file.variants?.map((v) => v.filePath) ?? [];
    return [file.filePath, ...variantPaths].filter(Boolean);
  }

  /**
   * Deletes physical files from disk if they exist
   * @param paths
   * @private
   */
  private async deletePhysicalFiles(paths: string[]) {
    for (const relativePath of paths) {
      const absolutePath = this.getAbsolutePath(relativePath);

      if (await isFileExists(absolutePath)) {
        await fs.unlink(absolutePath);
      }
    }
  }

  /**
   * Finds file by id or throws exception
   * @param ids
   * @private
   */
  private async findFilesOrThrow(ids: string[]): Promise<TFindFilesResponse[]> {
    const files = await this.prismaService.files.findMany({
      where: { id: { in: ids } },
      include: { variants: true },
    });

    if (!files) {
      throw new NotFoundException('File not found.');
    }

    return files;
  }

  /**
   * Builds file entity payload for database creation
   * @param file
   * @param filePath
   * @param extension
   * @param metadata
   * @param checksum
   * @param userId
   * @param folderId
   * @param isImage
   * @private
   */
  private async buildFileEntityData({
    file,
    filePath,
    extension,
    metadata,
    checksum,
    userId,
    folderId,
    isImage,
  }) {
    const stats = await fs.stat(this.getAbsolutePath(filePath));

    const baseData: any = {
      originalname: file.originalname.split('.').at(0),
      extension,
      mimeType: file.mimetype,
      size: stats.size,
      width: metadata.width,
      height: metadata.height,
      checksum,
      filePath,
      folderId,
      userId,
    };

    if (isImage) {
      baseData.blurhash = await this.generateBlurhash(file.buffer);
      baseData.dominantColor = await this.extractDominantColor(file.buffer);
    }

    return baseData;
  }

  /**
   * Saves file to filesystem
   * @param filePath
   * @param buffer
   * @private
   */
  private async savePhysicalFile(filePath: string, buffer: Buffer) {
    const absolutePath = this.getAbsolutePath(filePath);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, buffer);
  }

  /**
   * Returns top level mime type (image, video, ...)
   * @param mime
   * @private
   */
  private getFileType(mime: string): string {
    return mime.split('/')[0]?.toLowerCase() ?? '';
  }

  /**
   * Returns absolute path for filesystem operations
   * @param relativePath
   * @private
   */
  private getAbsolutePath(relativePath: string): string {
    return path.join(process.cwd(), relativePath);
  }

  /**
   *
   * @param file
   * @private
   */
  private async getExtension(file: MFile): Promise<string> {
    const extension = await fileTypeFromBuffer.fromBuffer(file.buffer);
    if (!extension) {
      throw new BadRequestException('File extension undefined');
    }
    return extension.ext;
  }
  //
  // private getFilePath(filePath): string {
  //   return path.join(process.cwd(), filePath);
  // }

  /**
   *
   * @param fileType
   * @param fileNameUUID
   * @param extension
   * @param variantType
   * @private
   */
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

  /**
   *
   * @param buffer
   * @private
   */
  private createChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   *
   * @param buffer
   * @private
   */
  private async extractDominantColor(buffer: Buffer): Promise<string | null> {
    const { dominant } = await sharp(buffer).stats();
    return `rgb(${dominant.r},${dominant.g},${dominant.b})`;
  }

  /**
   *
   * @param buffer
   * @private
   */
  private async generateBlurhash(buffer: Buffer): Promise<string | null> {
    const { data, info } = await sharp(buffer)
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' })
      .toBuffer({ resolveWithObject: true });

    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
  }

  /**
   *
   * @param tx
   * @param file
   * @param buffer
   * @param metadata
   * @param fileNameUUID
   * @private
   */
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
