import { BadRequestException } from '@nestjs/common';
import { FilePathService } from './file-path.service';
import fileTypeFromBuffer from 'file-type';
import path from 'path';
import { VariantType } from '@db/__generated__/enums';

jest.mock('file-type', () => ({
  __esModule: true,
  default: {
    fromBuffer: jest.fn(),
  },
}));

describe('FilePathService', () => {
  let service: FilePathService;

  beforeEach(() => {
    service = new FilePathService();
    jest.clearAllMocks();
  });

  describe('getExtension', () => {
    it('should return extension when file type detected', async () => {
      const mockBuffer = Buffer.from('test');
      (fileTypeFromBuffer.fromBuffer as jest.Mock).mockResolvedValue({
        ext: 'png',
        mime: 'image/png',
      });

      const result = await service.getExtension(mockBuffer);

      expect(result).toBe('png');
      expect(fileTypeFromBuffer.fromBuffer).toHaveBeenCalledWith(mockBuffer);
    });

    it('should throw BadRequestException when extension is undefined', async () => {
      const mockBuffer = Buffer.from('test');
      (fileTypeFromBuffer.fromBuffer as jest.Mock).mockResolvedValue(null);

      await expect(service.getExtension(mockBuffer)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getFileType', () => {
    it('should return top-level mime type', () => {
      const result = service.getFileType('image/png');
      expect(result).toBe('image');
    });

    it('should return empty string if mime invalid', () => {
      const result = service.getFileType('');
      expect(result).toBe('');
    });
  });

  describe('generatePath', () => {
    it('should generate path without variant', () => {
      const result = service.generatePath('image', 'uuid-123', 'webp');

      expect(result).toBe('uploads/image/uuid-123.webp');
    });

    it('should generate path with variant', () => {
      const result = service.generatePath(
        'image',
        'uuid-123',
        'webp',
        VariantType.SMALL,
      );

      expect(result).toBe('uploads/image/uuid-123_SMALL.webp');
    });
  });

  describe('getAbsolutePath', () => {
    it('should return absolute path', () => {
      const relative = 'uploads/image/test.webp';
      const expected = path.join(process.cwd(), relative);

      const result = service.getAbsolutePath(relative);

      expect(result).toBe(expected);
    });
  });
});
