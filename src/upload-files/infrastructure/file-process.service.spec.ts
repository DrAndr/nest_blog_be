import { BadRequestException } from '@nestjs/common';
import { FileProcessService } from './file-process.service';
import sharp from 'sharp';
import { encode } from 'blurhash';

jest.mock('sharp');
jest.mock('blurhash', () => ({
  encode: jest.fn(),
}));

describe('FileProcessService', () => {
  let service: FileProcessService;

  beforeEach(() => {
    service = new FileProcessService();
    jest.clearAllMocks();
  });

  //CHECKSUM
  describe('createChecksum', () => {
    it('should generate sha256 hash', () => {
      const buffer = Buffer.from('hello');
      const result = service.createChecksum(buffer);

      expect(result).toHaveLength(64);
      expect(typeof result).toBe('string');
    });
  });

  // CHECK BY CHECKSUM

  describe('checkByCheckSum', () => {
    it('should call prisma findFirst', async () => {
      const mockTx = {
        files: {
          findFirst: jest.fn().mockResolvedValue({ id: '1' }),
        },
      };

      const result = await service.checkByCheckSum(mockTx, 'abc');

      expect(mockTx.files.findFirst).toHaveBeenCalledWith({
        where: { checksum: 'abc' },
        include: { variants: true },
      });

      expect(result).toEqual({ id: '1' });
    });
  });

  //    METADATA

  describe('getMetadata', () => {
    it('should return sharp metadata', async () => {
      const mockMetadata = { width: 100, height: 200 };

      (sharp as unknown as jest.Mock).mockReturnValue({
        metadata: jest.fn().mockResolvedValue(mockMetadata),
      });

      const result = await service.getMetadata(Buffer.from('img'));

      expect(result).toEqual(mockMetadata);
    });
  });

  //   BLURHASH
  describe('generateBlurhash', () => {
    it('should generate blurhash', async () => {
      const mockToBuffer = jest.fn().mockResolvedValue({
        data: Buffer.from([0, 0, 0, 255]),
        info: { width: 32, height: 32 },
      });

      (sharp as unknown as jest.Mock).mockReturnValue({
        raw: () => ({
          ensureAlpha: () => ({
            resize: () => ({
              toBuffer: mockToBuffer,
            }),
          }),
        }),
      });

      (encode as jest.Mock).mockReturnValue('blurhash123');

      const result = await service.generateBlurhash(Buffer.from('img'));

      expect(result).toBe('blurhash123');
      expect(encode).toHaveBeenCalled();
    });
  });

  //   DOMINANT COLOR
  describe('extractDominantColor', () => {
    it('should return rgb string', async () => {
      (sharp as unknown as jest.Mock).mockReturnValue({
        stats: jest.fn().mockResolvedValue({
          dominant: { r: 10, g: 20, b: 30 },
        }),
      });

      const result = await service.extractDominantColor(Buffer.from('img'));

      expect(result).toBe('rgb(10,20,30)');
    });
  });

  //      RESIZE TO WEBP
  describe('resizeToWebp', () => {
    it('should resize and return metadata', async () => {
      const resizedBuffer = Buffer.from('resized');

      const firstSharpMock = {
        resize: () => ({
          webp: () => ({
            toBuffer: jest.fn().mockResolvedValue(resizedBuffer),
          }),
        }),
      };

      const secondSharpMock = {
        metadata: jest.fn().mockResolvedValue({
          width: 150,
          height: 100,
        }),
      };

      (sharp as unknown as jest.Mock)
        .mockReturnValueOnce(firstSharpMock)
        .mockReturnValueOnce(secondSharpMock);

      const result = await service.resizeToWebp(Buffer.from('img'), 150);

      expect(result.resized).toEqual(resizedBuffer);
      expect(result.metadata).toEqual({ width: 150, height: 100 });
    });
  });

  //  NORMALIZE IDS
  describe('normalizeIds', () => {
    it('should return array when string provided', () => {
      expect(service.normalizeIds('123')).toEqual(['123']);
    });

    it('should return array when array provided', () => {
      expect(service.normalizeIds(['1', '2'])).toEqual(['1', '2']);
    });

    it('should throw if string empty', () => {
      expect(() => service.normalizeIds('')).toThrow(BadRequestException);
    });

    it('should throw if array empty', () => {
      expect(() => service.normalizeIds([])).toThrow(BadRequestException);
    });
  });

  //    COLLECT FILE PATHS
  describe('collectFilePaths', () => {
    it('should collect original and variant paths', () => {
      const file = {
        filePath: 'original.jpg',
        variants: [{ filePath: 'small.jpg' }, { filePath: 'medium.jpg' }],
      };

      const result = service.collectFilePaths(file as any);

      expect(result).toEqual(['original.jpg', 'small.jpg', 'medium.jpg']);
    });

    it('should handle empty variants', () => {
      const file = {
        filePath: 'original.jpg',
        variants: [],
      };

      const result = service.collectFilePaths(file as any);

      expect(result).toEqual(['original.jpg']);
    });
  });
});
