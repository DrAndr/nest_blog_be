import { Test, TestingModule } from '@nestjs/testing';
import { UploadFilesService } from './upload-files.service';
import { PrismaService } from '@/infrastructure/prisma-provider/prisma.service';
import { FilePathService } from '@/upload-files/infrastructure/file-path.service';
import { FileProcessService } from '@/upload-files/infrastructure/file-process.service';
import { FileStorageService } from '@/upload-files/infrastructure/file-storage.service';
import { FileVariantsService } from '@/upload-files/infrastructure/file-variants.service';
import { MFile } from '@/upload-files/libs/MFile';
import { Files } from '@db/__generated__/client';

jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid',
}));

describe('UploadFilesService', () => {
  let service: UploadFilesService;
  const fileProcessService: FileProcessService = new FileProcessService();

  let prisma: jest.Mocked<PrismaService>;
  let pathService: jest.Mocked<FilePathService>;
  let processService: jest.Mocked<FileProcessService>;
  let storageService: jest.Mocked<FileStorageService>;
  let variantService: jest.Mocked<FileVariantsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadFilesService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn().mockImplementation((fn) =>
              fn({
                files: {
                  findUnique: jest.fn(),
                  findFirst: jest.fn(),
                  findMany: jest.fn(),
                  create: jest.fn(),
                  update: jest.fn(),
                  deleteMany: jest.fn(),
                },
                fileVariants: { create: jest.fn() },
              }),
            ),
            files: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: FilePathService,
          useValue: {
            getFileType: jest.fn().mockReturnValue('image'),
            getAbsolutePath: jest
              .fn()
              .mockImplementation((p) => `/mocked/${p}`),
            generatePath: jest
              .fn()
              .mockImplementation(
                (type, uuid, ext, variant) =>
                  `uploads/${type}/${uuid}${variant ? '_' + variant : ''}.${ext}`,
              ),
            getExtension: jest.fn().mockResolvedValue('png'),
          },
        },
        {
          provide: FileProcessService,
          useValue: {
            createChecksum: jest.fn().mockReturnValue('checksum123'),
            checkByCheckSum: jest.fn().mockResolvedValue(null),
            getMetadata: jest
              .fn()
              .mockResolvedValue({ width: 100, height: 50 }),
            generateBlurhash: jest.fn().mockResolvedValue('blurhash123'),
            extractDominantColor: jest.fn().mockResolvedValue('rgb(0,0,0)'),
            collectFilePaths: jest
              .fn()
              .mockImplementation((p) =>
                fileProcessService.collectFilePaths(p),
              ),
            normalizeIds: jest
              .fn()
              .mockImplementation((id) => fileProcessService.normalizeIds(id)),
          },
        },
        {
          provide: FileStorageService,
          useValue: {
            save: jest.fn(),
            getStats: jest.fn().mockResolvedValue({ size: 1024 }),
            delete: jest.fn(),
          },
        },
        {
          provide: FileVariantsService,
          useValue: {
            createImageVariants: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<UploadFilesService>(UploadFilesService);

    prisma = module.get(PrismaService);
    pathService = module.get(FilePathService);
    processService = module.get(FileProcessService);
    storageService = module.get(FileStorageService);
    variantService = module.get(FileVariantsService);
  });

  it('should create files and variants', async () => {
    const file: MFile = {
      buffer: Buffer.from('data'),
      mimetype: 'image/png',
      originalname: 'test.png',
      filename: 'filename',
    };
    const txMock = {
      files: { create: jest.fn().mockResolvedValue({ id: '1', variants: [] }) },
      fileVariants: { create: jest.fn() },
    };

    prisma.$transaction.mockImplementation(async (fn) => fn(txMock as any));

    processService.createChecksum.mockReturnValue('checksum');
    processService.checkByCheckSum.mockResolvedValue(null);
    pathService.getFileType.mockReturnValue('image');
    pathService.getExtension.mockResolvedValue('png');
    pathService.generatePath.mockReturnValue('uploads/image/uuid.png');
    storageService.getStats.mockResolvedValue({ size: 100 } as any);
    processService.getMetadata.mockResolvedValue({
      width: 200,
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
    });
    processService.generateBlurhash.mockResolvedValue('blurhash');
    processService.extractDominantColor.mockResolvedValue('rgb(1,2,3)');

    const result = await service.create([file], 'user-1');

    expect(result).toHaveLength(1);
    expect(storageService.save).toHaveBeenCalledWith(
      'uploads/image/uuid.png',
      file.buffer,
    );
    expect(variantService.createImageVariants).toHaveBeenCalled();
    expect(txMock.files.create).toHaveBeenCalled();
  });

  it('should throw NotFoundException if findOne not found', async () => {
    prisma.files.findUnique = jest.fn().mockResolvedValue(null);

    await expect(service.findOne('1')).rejects.toThrow('File not found, ID: 1');
  });

  it('should normalizeIds correctly', () => {
    expect(processService.normalizeIds?.('id1')).toEqual(['id1']);
    expect(processService.normalizeIds?.(['id1', 'id2'])).toEqual([
      'id1',
      'id2',
    ]);
  });

  it('should create a new file', async () => {
    const file: MFile = {
      buffer: Buffer.from('test'),
      originalname: 'test.png',
      mimetype: 'image/png',
      filename: 'filename',
    };
    const createdFile: Files = {
      id: '1',
      filePath: 'uploads/image/uuid.png',
      variants: [],
    } as any;

    prisma.$transaction = jest.fn().mockImplementation(async (fn) =>
      fn({
        files: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(createdFile),
        },
        fileVariants: { create: jest.fn() },
      }),
    );

    const result = await service.create([file], 'user-1');

    expect(result).toEqual([createdFile]);
    expect(processService.createChecksum).toHaveBeenCalledWith(file.buffer);
    expect(pathService.generatePath).toHaveBeenCalled();
    expect(storageService.save).toHaveBeenCalled();
    expect(variantService.createImageVariants).toHaveBeenCalled();
  });

  it('should remove files', async () => {
    // mocking the normalizeIds
    processService.normalizeIds = jest.fn().mockReturnValue(['1']);

    // mock prisma.files.findMany & deleteMany via jest.spyOn
    const findManySpy = jest
      .spyOn(prisma.files, 'findMany')
      .mockResolvedValue([
        { filePath: 'p1', variants: [{ filePath: 'v1' }] },
      ] as any);

    const deleteManySpy = jest
      .spyOn(prisma.files, 'deleteMany')
      .mockResolvedValue({ count: 1 } as any);

    // mock storageService.delete
    storageService.delete = jest.fn().mockResolvedValue(undefined);

    const response = await service.remove('1');

    expect(storageService.delete).toHaveBeenCalledWith(['p1', 'v1']);
    expect(deleteManySpy).toHaveBeenCalledWith({
      where: { id: { in: ['1'] } },
    });
    expect(response).toEqual({ message: '1 file(s) deleted.' });

    // restore mocked methods
    findManySpy.mockRestore();
    deleteManySpy.mockRestore();
  });
});
