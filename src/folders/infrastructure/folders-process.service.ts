import { BadRequestException, Injectable } from '@nestjs/common';
import { Folders } from '@db/__generated__/client';
import { FoldersRepository } from '@/folders/folders.repository';
import { GetParentsResponseDto } from '@/folders/dto/get-parents-response.dto';
import { MAX_FOLDERS_DEPTH } from '@/folders/libs/constants';
import { PrismaService } from '@/infrastructure/prisma-provider/prisma.service';

@Injectable()
export class FoldersProcessService {
  constructor(
    private foldersRepository: FoldersRepository,
    private prismaService: PrismaService,
  ) {}

  /**
   * Build nested tree
   * @param folders
   */
  public async buildTree(folders: Folders[]): Promise<GetParentsResponseDto[]> {
    const map = new Map<string, GetParentsResponseDto>();

    for (const folder of folders) {
      map.set(folder.id, { ...folder, children: [] });
    }

    let result: GetParentsResponseDto[] = [];

    for (const folder of folders) {
      const current = map.get(folder.id);
      if (!current) continue;

      if (folder.parentId && folder.parentId !== 'root') {
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
   * @param userId
   */
  public async isAncestor(
    folderId: string,
    destinationFolderId: string,
    userId: string,
  ): Promise<boolean> {
    if (destinationFolderId) {
      const parents = await this.foldersRepository.getTreeAsc(
        userId,
        destinationFolderId,
      );
      if (parents) {
        const isDescendant = parents.find((f) => f.id === folderId);
        if (isDescendant) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check is name used for the depth lvl
   * @param name
   * @param userId
   * @param parentId
   */
  async isNameUsed(
    name: string,
    userId: string,
    parentId: string | null,
  ): Promise<boolean> {
    const sibling = await this.prismaService.folders.findFirst({
      where: { name, userId, parentId },
    });
    return sibling?.id !== undefined;
  }

  /**
   * Check is new depth lvl allowed
   * @param userId
   * @param parentId
   */
  async validateDepth(userId: string, parentId: string): Promise<void> {
    const depth = await this.foldersRepository.getFolderDepth(userId, parentId);
    if (depth + 1 >= MAX_FOLDERS_DEPTH) {
      throw new BadRequestException(
        `Nesting limit reached, maximum nesting depth: ${MAX_FOLDERS_DEPTH}`,
      );
    }
  }
}
