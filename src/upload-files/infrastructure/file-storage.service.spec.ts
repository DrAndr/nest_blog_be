import { FileStorageService } from './file-storage.service';
import { FilePathService } from '@/upload-files/infrastructure/file-path.service';
import fs from 'fs/promises';
import path from 'path';
import { isFileExists } from '@/upload-files/libs/utils/isFileExists';

jest.mock('fs/promises');
jest.mock('@/upload-files/libs/utils/isFileExists', () => ({
  isFileExists: jest.fn(),
}));

describe('FileStorageService', () => {
  let service: FileStorageService;
  let pathService: jest.Mocked<FilePathService>;

  beforeEach(() => {
    pathService = {
      getAbsolutePath: jest.fn(),
    } as any;

    service = new FileStorageService(pathService);

    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should create directory and write file', async () => {
      const relativePath = 'uploads/image/test.png';
      const absolutePath = '/root/uploads/image/test.png';
      const buffer = Buffer.from('data');

      pathService.getAbsolutePath.mockReturnValue(absolutePath);

      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await service.save(relativePath, buffer);

      expect(pathService.getAbsolutePath).toHaveBeenCalledWith(relativePath);

      expect(fs.mkdir).toHaveBeenCalledWith(path.dirname(absolutePath), {
        recursive: true,
      });

      expect(fs.writeFile).toHaveBeenCalledWith(absolutePath, buffer);
    });
  });

  describe('delete', () => {
    it('should delete existing files', async () => {
      const relativePath = 'uploads/test.png';
      const absolutePath = '/root/uploads/test.png';

      pathService.getAbsolutePath.mockReturnValue(absolutePath);
      (isFileExists as jest.Mock).mockResolvedValue(true);
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      await service.delete([relativePath]);

      expect(isFileExists).toHaveBeenCalledWith(absolutePath);
      expect(fs.unlink).toHaveBeenCalledWith(absolutePath);
    });

    it('should not delete file if it does not exist', async () => {
      const relativePath = 'uploads/test.png';
      const absolutePath = '/root/uploads/test.png';

      pathService.getAbsolutePath.mockReturnValue(absolutePath);
      (isFileExists as jest.Mock).mockResolvedValue(false);

      await service.delete([relativePath]);

      expect(fs.unlink).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return file stats', async () => {
      const relativePath = 'uploads/test.png';
      const absolutePath = '/root/uploads/test.png';

      const mockStats = { size: 1234 } as any;

      pathService.getAbsolutePath.mockReturnValue(absolutePath);
      (fs.stat as jest.Mock).mockResolvedValue(mockStats);

      const result = await service.getStats(relativePath);

      expect(pathService.getAbsolutePath).toHaveBeenCalledWith(relativePath);
      expect(fs.stat).toHaveBeenCalledWith(absolutePath);
      expect(result).toBe(mockStats);
    });
  });
});
