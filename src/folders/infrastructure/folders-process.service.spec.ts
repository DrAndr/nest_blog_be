import { FoldersProcessService } from './folders-process.service';
import { FoldersRepository } from '@/folders/folders.repository';
import { Folders } from '@db/__generated__/client';

describe('FoldersProcessService', () => {
  let service: FoldersProcessService;
  let repository: jest.Mocked<FoldersRepository>;

  beforeEach(() => {
    repository = {
      getTreeAsc: jest.fn(),
    } as unknown as jest.Mocked<FoldersRepository>;

    service = new FoldersProcessService(repository);
  });

  describe('buildTree', () => {
    it('should build nested tree correctly', async () => {
      const folders: Folders[] = [
        { id: '1', name: 'root', parentId: null } as Folders,
        { id: '2', name: 'child-1', parentId: '1' } as Folders,
        { id: '3', name: 'child-2', parentId: '1' } as Folders,
        { id: '4', name: 'sub-child', parentId: '2' } as Folders,
      ];

      const result = await service.buildTree(folders);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].children).toHaveLength(2);

      const child1 = result[0].children.find((c) => c.id === '2');
      expect(child1?.children).toHaveLength(1);
      expect(child1?.children[0].id).toBe('4');
    });

    it('should handle multiple root folders', async () => {
      const folders: Folders[] = [
        { id: '1', name: 'root-1', parentId: null } as Folders,
        { id: '2', name: 'root-2', parentId: null } as Folders,
      ];

      const result = await service.buildTree(folders);

      expect(result).toHaveLength(2);
      expect(result.map((f) => f.id)).toEqual(
        expect.arrayContaining(['1', '2']),
      );
    });
  });

  describe('isAncestor', () => {
    it('should return true if folder is ancestor', async () => {
      repository.getTreeAsc.mockResolvedValue([
        { id: '1', parentId: null } as Folders,
        { id: '2', parentId: '1' } as Folders,
      ]);

      const result = await service.isAncestor('1', '2');

      expect(repository.getTreeAsc).toHaveBeenCalledWith('2');
      expect(result).toBe(true);
    });

    it('should return false if folder is not ancestor', async () => {
      repository.getTreeAsc.mockResolvedValue([
        { id: '3', parentId: null } as Folders,
      ]);

      const result = await service.isAncestor('1', '3');

      expect(result).toBe(false);
    });

    it('should return false if destinationFolderId is null', async () => {
      const result = await service.isAncestor('1', null as any);

      expect(result).toBe(false);
      expect(repository.getTreeAsc).not.toHaveBeenCalled();
    });

    it('should return false if repository returns null', async () => {
      repository.getTreeAsc.mockResolvedValue(null);

      const result = await service.isAncestor('1', '2');

      expect(result).toBe(false);
    });
  });
});
