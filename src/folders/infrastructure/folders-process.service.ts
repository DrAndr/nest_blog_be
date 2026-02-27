import { Injectable, NotFoundException } from '@nestjs/common';
import { FoldersService } from '@/folders/folders.service';
import { PrismaService } from '@/infrastructure/prisma-provider/prisma.service';
import { CreateFolderDto } from '@/folders/dto/create-folder.dto';
import { Folders } from '@db/__generated__/client';
import { IFoldersTreeNode } from '@/folders/libs/interfaces/folders-tree-node.interface';
import { FoldersRepository } from '@/folders/folders.repository';

@Injectable()
export class FoldersProcessService {
  constructor(private foldersRepository: FoldersRepository) {}

  /**
   * Build nested tree
   * @param folders
   */
  public async buildTree(folders: Folders[]): Promise<IFoldersTreeNode[]> {
    const map = new Map<string, IFoldersTreeNode>();

    for (const folder of folders) {
      map.set(folder.id, { ...folder, children: [] });
    }

    let result: IFoldersTreeNode[] = [];

    for (const folder of folders) {
      const current = map.get(folder.id);
      if (!current) continue;

      if (folder.parentId) {
        map.get(folder.parentId)?.children.push(current);
      } else {
        result.push(current);
      }
    }

    return result;
  }

  /**
   * Check is moved folder is an ancestor of the destination folder
   * @param folderId
   * @param destinationFolderId
   */
  public async isAncestor(folderId: string, destinationFolderId: string) {
    if (destinationFolderId) {
      const parents =
        await this.foldersRepository.getTreeAsc(destinationFolderId);
      if (parents) {
        const isDescendant = parents.find((f) => f.id === folderId);
        if (isDescendant) {
          return true;
        }
      }
    }
    return false;
  }
}
