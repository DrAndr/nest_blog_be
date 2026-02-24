import { Test, TestingModule } from '@nestjs/testing';
import { UploadFilesController } from './upload-files.controller';
import { UploadFilesService } from './upload-files.service';
import { UpdateFileDto } from './dto/update-file.dto';
import { ExecutionContext, Injectable, CanActivate } from '@nestjs/common';
import { AuthGuard } from '@/auth/presentation/guards/auth.guard';

@Injectable()
class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true; // allow access
  }
}
jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid',
}));

describe('UploadFilesController', () => {
  let controller: UploadFilesController;
  let service: jest.Mocked<UploadFilesService>;

  const mockUploadFilesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadFilesController],
      providers: [
        {
          provide: UploadFilesService,
          useValue: mockUploadFilesService,
        },
      ],
    })
      .overrideGuard(AuthGuard) // <-- mocking guard
      .useClass(MockAuthGuard)
      .compile();

    controller = module.get<UploadFilesController>(UploadFilesController);
    service = module.get(UploadFilesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call uploadFilesService.create', async () => {
      const files = [
        {
          originalname: 'test.jpg',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('test'),
        },
      ] as Express.Multer.File[];

      const userId = 'user-123';
      const folderId = 'folder-1';

      const mockResult = [{ id: 'file-1' }];
      service.create.mockResolvedValue(mockResult as any);

      const result = await controller.create(files, userId, folderId);

      expect(service.create).toHaveBeenCalledWith(files, userId, folderId);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAll', () => {
    it('should return all files', async () => {
      const mockResult = [{ id: 'file-1' }];
      const findOptions = {
        filter: [{ field: 'size', type: '==', value: '5555' }],
      };
      service.findAll.mockResolvedValue(mockResult as any);

      const mockFilterDto = { findOptions };

      const result = await controller.findAll(mockFilterDto as any);

      expect(service.findAll).toHaveBeenCalledWith(findOptions);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return file by id', async () => {
      const fileId = 'file-123';
      const mockResult = { id: fileId };

      service.findOne.mockResolvedValue(mockResult as any);

      const result = await controller.findOne(fileId);

      expect(service.findOne).toHaveBeenCalledWith(fileId);
      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('should update file metadata', async () => {
      const fileId = 'file-123';
      const dto: UpdateFileDto = {
        name: 'updated-name',
      } as any;

      const mockResult = { id: fileId, ...dto };

      service.update.mockResolvedValue(mockResult as any);

      const result = await controller.update(fileId, dto);

      expect(service.update).toHaveBeenCalledWith(fileId, dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('remove', () => {
    it('should delete file', async () => {
      const fileId = 'file-123';

      service.remove.mockResolvedValue({ success: true } as any);

      const result = await controller.remove(fileId);

      expect(service.remove).toHaveBeenCalledWith(fileId);
      expect(result).toEqual({ success: true });
    });
  });
});
