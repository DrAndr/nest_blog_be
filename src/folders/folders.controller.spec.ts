import { Test, TestingModule } from '@nestjs/testing';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@/auth/presentation/guards/auth.guard';

@Injectable()
class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true; // allow access
  }
}

describe('FoldersController', () => {
  let controller: FoldersController;
  let service: jest.Mocked<FoldersService>;
  const userId = 'user_id_value';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoldersController],
      providers: [
        {
          provide: FoldersService,
          useValue: {
            create: jest.fn(),
            getTree: jest.fn(),
            getById: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard) // <-- mocking guard
      .useClass(MockAuthGuard)
      .compile();

    controller = module.get<FoldersController>(FoldersController);
    service = module.get(FoldersService);
  });

  describe('create', () => {
    it('should call service.create', async () => {
      service.create.mockResolvedValue({ id: '1' } as any);

      const dto = { name: 'Documents' };
      const result = await controller.create(userId, dto as any);

      expect(service.create).toHaveBeenCalledWith(userId, dto);
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('getTree', () => {
    it('should call service.getTree', async () => {
      service.getTree.mockResolvedValue([]);

      const result = await controller.getTree(userId, '1');

      expect(service.getTree).toHaveBeenCalledWith(userId, '1');
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should call service.getById', async () => {
      service.getById.mockResolvedValue({ id: '1' } as any);

      const result = await controller.findOne(userId, '1');

      expect(service.getById).toHaveBeenCalledWith(userId, '1');
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      service.update.mockResolvedValue({ id: '1', name: 'New' } as any);

      const result = await controller.update(userId, '1', { name: 'New' });

      expect(service.update).toHaveBeenCalledWith(userId, '1', { name: 'New' });
      expect(result).toEqual({ id: '1', name: 'New' });
    });
  });

  describe('remove', () => {
    it('should call service.remove', async () => {
      service.remove.mockResolvedValue({ id: '1' } as any);

      const result = await controller.remove(userId, '1');

      expect(service.remove).toHaveBeenCalledWith(userId, '1');
      expect(result).toEqual({ id: '1' });
    });
  });
});
