import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { UpdateFileDto } from './dto/update-file.dto';
import { PrismaService } from '@/infrastructure/prisma-provider/prisma.service';
import { IServiceResponse } from '@/libs/interfaces';
import { MFile } from '@/upload-files/libs/MFile';
import { Files, Folders, Prisma } from '@db/__generated__/client';
import { UploadFile } from '@/upload-files/entities/upload-file.entity';

import { IMAGE_FILE_TYPE } from '@/upload-files/libs/constants';
import { FilePathService } from '@/upload-files/infrastructure/file-path.service';
import { FileProcessService } from '@/upload-files/infrastructure/file-process.service';
import { FileStorageService } from '@/upload-files/infrastructure/file-storage.service';
import { FileVariantsService } from '@/upload-files/infrastructure/file-variants.service';

@Injectable()
export class UploadFilesService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly pathService: FilePathService,
    private readonly processService: FileProcessService,
    private readonly variantService: FileVariantsService,
    private readonly storageService: FileStorageService,
  ) {}

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
        const checksum = this.processService.createChecksum(file.buffer);

        // Prevent duplicate file uploads
        const existing = await this.processService.checkByCheckSum(
          tx,
          checksum,
        );
        if (existing) {
          results.push(existing);
          continue;
        }

        const fileType = this.pathService.getFileType(file.mimetype);
        const isImage = fileType === IMAGE_FILE_TYPE;

        const fileNameUUID = uuid();
        const extension = await this.pathService.getExtension(file.buffer);

        const filePath = this.pathService.generatePath(
          fileType,
          fileNameUUID,
          extension,
        );

        /**
         * Save physical files
         */
        await this.storageService.save(filePath, file.buffer);

        /**
         * collect file data for save in to db
         */
        const metadata = await this.processService.getMetadata(file.buffer);
        const stats = await this.storageService.getStats(filePath);
        const baseData: any = {
          name: file.originalname.split('.').at(0),
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
          baseData.blurhash = await this.processService.generateBlurhash(
            file.buffer,
          );
          baseData.dominantColor =
            await this.processService.extractDominantColor(file.buffer);
        }

        const createdFile = await tx.files.create({
          data: baseData,
          include: { variants: true },
        });

        if (isImage) {
          await this.variantService.createImageVariants({
            tx,
            file: createdFile,
            buffer: file.buffer,
            metadata,
            fileNameUUID,
          });
        }

        results.push(createdFile);
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
    const ids = this.processService.normalizeIds(id);
    const files = await this.prismaService.files.findMany({
      where: { id: { in: ids } },
      include: { variants: true },
    });

    if (!files) {
      throw new NotFoundException('File not found.');
    }

    if (!files || !files.length) {
      throw new NotFoundException(`Files not found`);
    }

    const filePaths = files.flatMap((file) =>
      this.processService.collectFilePaths(file),
    );
    await this.storageService.delete(filePaths);

    const response = await this.prismaService.files.deleteMany({
      where: { id: { in: ids } },
    });

    return {
      message: `${response.count} file(s) deleted.`,
    };
  }
}
