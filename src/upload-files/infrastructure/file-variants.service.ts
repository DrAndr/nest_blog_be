import { Injectable } from '@nestjs/common';
import { VariantType } from '@db/__generated__/enums';
import sharp from 'sharp';
import { FilePathService } from '@/upload-files/infrastructure/file-path.service';
import { IMAGE_FILE_TYPE, WEBP_EXTENSION } from '@/upload-files/libs/constants';
import fs from 'fs/promises';
import * as path from 'path';
import { FileProcessService } from '@/upload-files/infrastructure/file-proccess.service';

@Injectable()
export class FileVariantsService {
  constructor(
    private readonly pathService: FilePathService,
    private readonly processService: FileProcessService,
  ) {}
  /**
   *
   * @param tx
   * @param file
   * @param buffer
   * @param metadata
   * @param fileNameUUID
   * @private
   */
  async createImageVariants({ tx, file, buffer, metadata, fileNameUUID }) {
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

      const { resized, metadata: resizedMeta } =
        await this.processService.resizeToWebp(buffer, variant.width);

      const filePath = this.pathService.generatePath(
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
