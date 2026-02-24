import { BadRequestException, Injectable } from '@nestjs/common';
import fileTypeFromBuffer from 'file-type';
import { VariantType } from '@db/__generated__/enums';
import path from 'path';

@Injectable()
export class FilePathService {
  /**
   * Get file extension
   * @param buffer
   * @private
   */
  async getExtension(buffer: Buffer): Promise<string> {
    const extension = await fileTypeFromBuffer.fromBuffer(buffer);
    if (!extension) {
      throw new BadRequestException('File extension undefined');
    }
    return extension.ext;
  }

  /**
   * Returns top level mime type (image, video, ...)
   * @param mime
   * @private
   */
  public getFileType(mime: string): string {
    return mime.split('/')[0]?.toLowerCase() ?? '';
  }

  /**
   *
   * @param fileType
   * @param fileNameUUID
   * @param extension
   * @param variantType
   * @private
   */
  generatePath(
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
   * Returns absolute path for filesystem operations
   * @param relativePath
   * @private
   */
  public getAbsolutePath(relativePath: string): string {
    return path.join(process.cwd(), relativePath);
  }
}
