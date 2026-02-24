import { Injectable } from '@nestjs/common';
import fs from 'fs/promises';
import path from 'path';
import { FilePathService } from '@/upload-files/infrastructure/file-path.service';
import { isFileExists } from '@/upload-files/libs/utils/isFileExists';
import { Stats } from 'node:fs';

@Injectable()
export class FileStorageService {
  public constructor(private readonly pathService: FilePathService) {}

  /**
   * Saves file to filesystem
   * @param filePath
   * @param buffer
   * @private
   */
  public async save(filePath: string, buffer: Buffer) {
    const absolutePath = this.pathService.getAbsolutePath(filePath);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, buffer);
  }

  /**
   * Deletes physical files from disk if they exist
   * @param paths
   * @private
   */
  public async delete(paths: string[]) {
    for (const relativePath of paths) {
      const absolutePath = this.pathService.getAbsolutePath(relativePath);

      if (await isFileExists(absolutePath)) {
        await fs.unlink(absolutePath);
      }
    }
  }

  /**
   * Get file stats (size, etc...)
   * @param filePath
   */
  public async getStats(filePath: string): Promise<Stats> {
    return fs.stat(this.pathService.getAbsolutePath(filePath));
  }
}
