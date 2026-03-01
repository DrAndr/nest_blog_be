import { BadRequestException } from '@nestjs/common';
import { FoldersProcessService } from './folders-process.service';
import { FoldersRepository } from '@/folders/folders.repository';
import { PrismaService } from '@/infrastructure/prisma-provider/prisma.service';
import { MAX_FOLDERS_DEPTH } from '@/folders/libs/constants';

describe('FoldersProcessService', () => {
  let service: FoldersProcessService;

  const foldersRepositoryMock = {
    getTreeAsc: jest.fn(),
    getFolderDepth: jest.fn(),
  };

  const prismaServiceMock = {
    folders: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new FoldersProcessService(
      foldersRepositoryMock as unknown as FoldersRepository,
      prismaServiceMock as unknown as PrismaService,
    );
  });

  describe('buildTree', () => {
    it('should build nested structure correctly', async () => {
      const folders: any[] = [
        { id: '1', name: 'root', parentId: null },
        { id: '2', name: 'child-1', parentId: '1' },
        { id: '3', name: 'child-2', parentId: '1' },
      ];

      const result = await service.buildTree(folders as any);

      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(2);
      expect(result[0].children[0].id).toBe('2');
      expect(result[0].children[1].id).toBe('3');
    });

    it('should return empty array if no folders', async () => {
      const result = await service.buildTree([]);
      expect(result).toEqual([]);
    });
  });

  describe('isAncestor', () => {
    it('should return true if folder is ancestor', async () => {
      foldersRepositoryMock.getTreeAsc.mockResolvedValue([
        { id: 'parent' },
        { id: 'ancestor-id' },
      ]);

      const result = await service.isAncestor(
        'ancestor-id',
        'destination-id',
        'user-id',
      );

      expect(result).toBe(true);
      expect(foldersRepositoryMock.getTreeAsc).toHaveBeenCalled();
    });

    it('should return false if folder is not ancestor', async () => {
      foldersRepositoryMock.getTreeAsc.mockResolvedValue([
        { id: 'some-other-id' },
      ]);

      const result = await service.isAncestor(
        'folder-id',
        'destination-id',
        'user-id',
      );

      expect(result).toBe(false);
    });

    it('should return false if no parents found', async () => {
      foldersRepositoryMock.getTreeAsc.mockResolvedValue(null);

      const result = await service.isAncestor(
        'folder-id',
        'destination-id',
        'user-id',
      );

      expect(result).toBe(false);
    });
  });

  describe('isNameUsed', () => {
    it('should return true if folder exists', async () => {
      prismaServiceMock.folders.findFirst.mockResolvedValue({
        id: 'existing-id',
      });

      const result = await service.isNameUsed('test', 'user-id', null);

      expect(result).toBe(true);
      expect(prismaServiceMock.folders.findFirst).toHaveBeenCalled();
    });

    it('should return false if folder does not exist', async () => {
      prismaServiceMock.folders.findFirst.mockResolvedValue(null);

      const result = await service.isNameUsed('test', 'user-id', null);

      expect(result).toBe(false);
    });
  });

  describe('validateDepth', () => {
    it('should not throw if depth is allowed', async () => {
      foldersRepositoryMock.getFolderDepth.mockResolvedValue(
        MAX_FOLDERS_DEPTH - 2,
      );

      await expect(
        service.validateDepth('user-id', 'parent-id'),
      ).resolves.not.toThrow();
    });

    it('should throw BadRequestException if depth exceeded', async () => {
      foldersRepositoryMock.getFolderDepth.mockResolvedValue(
        MAX_FOLDERS_DEPTH - 1,
      );

      await expect(
        service.validateDepth('user-id', 'parent-id'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
