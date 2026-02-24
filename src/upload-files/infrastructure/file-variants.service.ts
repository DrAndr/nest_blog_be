import { Injectable } from '@nestjs/common';
import { VariantType } from '@db/__generated__/enums';
import { FilePathService } from '@/upload-files/infrastructure/file-path.service';
import { IMAGE_FILE_TYPE, WEBP_EXTENSION } from '@/upload-files/libs/constants';
import { FileProcessService } from '@/upload-files/infrastructure/file-process.service';
import { FileStorageService } from '@/upload-files/infrastructure/file-storage.service';

@Injectable()
export class FileVariantsService {
  constructor(
    private readonly pathService: FilePathService,
    private readonly processService: FileProcessService,
    private readonly storageService: FileStorageService,
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

    const validVariants = sizes.filter(
      (variant) => variant.width <= metadata.width,
    );

    await Promise.all(
      validVariants.map(async (variant) => {
        const { resized, metadata: resizedMeta } =
          await this.processService.resizeToWebp(buffer, variant.width);

        const filePath = this.pathService.generatePath(
          IMAGE_FILE_TYPE,
          fileNameUUID,
          WEBP_EXTENSION,
          variant.type,
        );

        await this.storageService.save(filePath, resized);

        return tx.fileVariants.create({
          data: {
            fileId: file.id,
            type: variant.type,
            format: WEBP_EXTENSION,
            width: resizedMeta.width ?? variant.width,
            height: resizedMeta.height,
            size: resized.length,
            filePath,
          },
        });
      }),
    );
  }
}
