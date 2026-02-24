import { FileVariantsService } from './file-variants.service';
import { FilePathService } from '@/upload-files/infrastructure/file-path.service';
import { FileProcessService } from '@/upload-files/infrastructure/file-process.service';
import { FileStorageService } from '@/upload-files/infrastructure/file-storage.service';
import { WEBP_EXTENSION } from '@/upload-files/libs/constants';

describe('FileVariantsService', () => {
  let service: FileVariantsService;

  let pathService: jest.Mocked<FilePathService>;
  let processService: jest.Mocked<FileProcessService>;
  let storageService: jest.Mocked<FileStorageService>;

  const mockTx = {
    fileVariants: {
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    pathService = {
      generatePath: jest.fn(),
    } as any;

    processService = {
      resizeToWebp: jest.fn(),
    } as any;

    storageService = {
      save: jest.fn(),
    } as any;

    service = new FileVariantsService(
      pathService,
      processService,
      storageService,
    );

    jest.clearAllMocks();
  });

  it('should create valid variants in parallel', async () => {
    const file = { id: 'file-1' };
    const buffer = Buffer.from('image');
    const metadata = { width: 800, height: 600 };
    const fileNameUUID = 'uuid-123';

    const resizedBuffer = Buffer.from('resized');

    processService.resizeToWebp.mockResolvedValue({
      resized: resizedBuffer,
      metadata: {
        width: 150,
        height: 100,
        format: 'webp',
        autoOrient: {
          width: 0,
          height: 0,
        },
        space: 'b-w',
        channels: 1,
        depth: 'int',
        isProgressive: false,
        isPalette: false,
        hasProfile: false,
        hasAlpha: false,
      },
    });

    pathService.generatePath.mockImplementation(
      (_type, _uuid, _ext, variantType) =>
        `uploads/image/${fileNameUUID}_${variantType}.webp`,
    );

    mockTx.fileVariants.create.mockResolvedValue({});

    await service.createImageVariants({
      tx: mockTx,
      file,
      buffer,
      metadata,
      fileNameUUID,
    });

    // resize called only for widths <= original
    expect(processService.resizeToWebp).toHaveBeenCalled();

    // storage save called
    expect(storageService.save).toHaveBeenCalled();

    // prisma called
    expect(mockTx.fileVariants.create).toHaveBeenCalled();
  });

  it('should skip variants larger than original image', async () => {
    const file = { id: 'file-1' };
    const buffer = Buffer.from('image');
    const metadata = { width: 300, height: 200 };
    const fileNameUUID = 'uuid-123';

    processService.resizeToWebp.mockResolvedValue({
      resized: Buffer.from('resized'),
      metadata: {
        width: 150,
        height: 100,
        format: 'webp',
        autoOrient: {
          width: 0,
          height: 0,
        },
        space: 'b-w',
        channels: 1,
        depth: 'int',
        isProgressive: false,
        isPalette: false,
        hasProfile: false,
        hasAlpha: false,
      },
    });

    pathService.generatePath.mockReturnValue('uploads/test.webp');
    mockTx.fileVariants.create.mockResolvedValue({});

    await service.createImageVariants({
      tx: mockTx,
      file,
      buffer,
      metadata,
      fileNameUUID,
    });

    expect(processService.resizeToWebp).toHaveBeenCalledTimes(2);
  });

  it('should store correct data in prisma', async () => {
    const file = { id: 'file-1' };
    const buffer = Buffer.from('image');
    const metadata = { width: 400, height: 300 };
    const fileNameUUID = 'uuid-123';

    const resizedBuffer = Buffer.from('resized');

    processService.resizeToWebp.mockResolvedValue({
      resized: resizedBuffer,
      metadata: {
        width: 400,
        height: 300,
        format: 'webp',
        autoOrient: {
          width: 0,
          height: 0,
        },
        space: 'b-w',
        channels: 1,
        depth: 'int',
        isProgressive: false,
        isPalette: false,
        hasProfile: false,
        hasAlpha: false,
      },
    });

    pathService.generatePath.mockReturnValue(
      'uploads/image/uuid-123_ORIGINAL.webp',
    );

    mockTx.fileVariants.create.mockResolvedValue({});

    await service.createImageVariants({
      tx: mockTx,
      file,
      buffer,
      metadata,
      fileNameUUID,
    });

    expect(mockTx.fileVariants.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fileId: 'file-1',
          format: WEBP_EXTENSION,
          size: resizedBuffer.length,
          filePath: expect.any(String),
        }),
      }),
    );
  });
});
