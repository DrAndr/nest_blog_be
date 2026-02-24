import { BadRequestException, Injectable } from '@nestjs/common';
import crypto from 'crypto';
import sharp from 'sharp';
import { encode } from 'blurhash';
import { Files } from '@db/__generated__/client';
import fileTypeFromBuffer from 'file-type';
import { MFile } from '@/upload-files/libs/MFile';

@Injectable()
export class FileProcessService {
  /**
   * Generate checksum
   * @param buffer
   * @private
   */
  createChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Checks if file with the same checksum already exists
   * @param tx
   * @param checksum
   */
  async checkByCheckSum(tx, checksum: string): Promise<Files | null> {
    return tx.files.findFirst({
      where: { checksum },
      include: { variants: true },
    });
  }

  /**
   *  Get file meta
   * @param buffer
   */
  async getMetadata(buffer: Buffer) {
    return sharp(buffer).metadata();
  }

  /**
   * Generate and return blurhash
   * @param buffer
   */
  async generateBlurhash(buffer: Buffer): Promise<string | null> {
    const { data, info } = await sharp(buffer)
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' })
      .toBuffer({ resolveWithObject: true });

    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
  }

  /**
   * Define and return dominant image color
   * @param buffer
   */
  async extractDominantColor(buffer: Buffer): Promise<string | null> {
    const { dominant } = await sharp(buffer).stats();
    return `rgb(${dominant.r},${dominant.g},${dominant.b})`;
  }

  /**
   * Resize origin image buffer to thw webp thumbnail variant
   * @param buffer
   * @param width
   */
  async resizeToWebp(buffer: Buffer, width: number) {
    const resizedBuffer = await sharp(buffer)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const metadata = await sharp(resizedBuffer).metadata();

    return { resized: resizedBuffer, metadata };
  }

  /**
   * Normalizes single id or array of ids into string[]
   * @param id
   */
  normalizeIds(id: string | string[]): string[] {
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
   * Collects original file and all variant paths
   * @param file
   * @private
   */
  public collectFilePaths(file: Files & { variants: any[] }): string[] {
    const variantPaths = file.variants?.map((v) => v.filePath) ?? [];
    return [file.filePath, ...variantPaths].filter(Boolean);
  }
}
