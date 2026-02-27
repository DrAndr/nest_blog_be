import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { MAX_FOLDERS_DEPTH } from '@/folders/libs/constants';

describe('FoldersService', () => {
  let service: FoldersService;

  let prisma: any;
  let repository: any;
  let processService: any;

  beforeEach(() => {
    prisma = {
      folders: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      files: {
        findFirst: jest.fn(),
      },
    };

    repository = {
      getTreeAsc: jest.fn(),
      getTreeDesc: jest.fn(),
      getFolderDepth: jest.fn(),
    };

    processService = {
      buildTree: jest.fn(),
      isAncestor: jest.fn(),
    };

    service = new FoldersService(prisma, repository, processService);
  });

  describe('create', () => {
    it('should create folder without parent', async () => {
      prisma.folders.create.mockResolvedValue({ id: '1' });

      const result = await service.create({ name: 'root' });

      expect(prisma.folders.create).toHaveBeenCalledWith({
        data: { name: 'root', parentId: null },
      });

      expect(result).toEqual({ id: '1' });
    });

    it('should validate depth if parent exists', async () => {
      repository.getFolderDepth.mockResolvedValue(1);
      prisma.folders.create.mockResolvedValue({ id: '2' });

      await service.create({ name: 'child', parentId: '1' });

      expect(repository.getFolderDepth).toHaveBeenCalledWith('1');
    });

    it('should throw if depth exceeded', async () => {
      repository.getFolderDepth.mockResolvedValue(MAX_FOLDERS_DEPTH);

      await expect(
        service.create({ name: 'child', parentId: '1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequest if prisma throws', async () => {
      prisma.folders.create.mockRejectedValue(new Error());

      await expect(service.create({ name: 'root' })).rejects.toThrow(Error);
    });
  });

  describe('getTree', () => {
    it('should return built tree', async () => {
      const folders = [{ id: '1' }];
      repository.getTreeAsc.mockResolvedValue(folders);
      processService.buildTree.mockResolvedValue([{ id: '1', children: [] }]);

      const result = await service.getTree('1');

      expect(processService.buildTree).toHaveBeenCalledWith(folders);
      expect(result).toEqual([{ id: '1', children: [] }]);
    });

    it('should throw if folder not found', async () => {
      repository.getTreeAsc.mockResolvedValue(null);

      await expect(service.getTree('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getById', () => {
    it('should return folder', async () => {
      prisma.folders.findUnique.mockResolvedValue({ id: '1' });

      const result = await service.getById('1');

      expect(result).toEqual({ id: '1' });
    });

    it('should throw if folder not found', async () => {
      prisma.folders.findUnique.mockResolvedValue(null);

      await expect(service.getById('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should throw if moving folder into itself', async () => {
      await expect(service.update('1', { parentId: '1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if moving into child', async () => {
      repository.getFolderDepth.mockResolvedValue(1);
      processService.isAncestor.mockResolvedValue(true);

      await expect(service.update('1', { parentId: '2' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update successfully', async () => {
      repository.getFolderDepth.mockResolvedValue(1);
      processService.isAncestor.mockResolvedValue(false);
      prisma.folders.update.mockResolvedValue({ id: '1', name: 'new' });

      const result = await service.update('1', { name: 'new' });

      expect(prisma.folders.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'new' },
      });

      expect(result).toEqual({ id: '1', name: 'new' });
    });

    it('should throw BadRequest if prisma update fails', async () => {
      prisma.folders.update.mockRejectedValue(new Error());

      await expect(service.update('1', { name: 'new' })).rejects.toThrow(Error);
    });
  });

  describe('remove', () => {
    it('should throw if folder has children', async () => {
      repository.getTreeDesc.mockResolvedValue([{}]);

      await expect(service.remove('1')).rejects.toThrow(BadRequestException);
    });

    it('should throw if folder has files', async () => {
      repository.getTreeDesc.mockResolvedValue(null);
      prisma.files.findFirst.mockResolvedValue({ id: 'file1' });

      await expect(service.remove('1')).rejects.toThrow(BadRequestException);
    });

    it('should delete folder if empty', async () => {
      repository.getTreeDesc.mockResolvedValue(null);
      prisma.files.findFirst.mockResolvedValue(null);
      prisma.folders.delete.mockResolvedValue({ id: '1' });

      const result = await service.remove('1');

      expect(prisma.folders.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });

      expect(result).toEqual({ id: '1' });
    });
  });
});
