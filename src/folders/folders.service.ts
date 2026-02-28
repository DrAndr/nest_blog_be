import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateFolderDto } from './dto/create-folder.dto';
import { PrismaService } from '@/infrastructure/prisma-provider/prisma.service';
import { Folders } from '@db/__generated__/client';
import { FoldersRepository } from '@/folders/folders.repository';
import { MAX_FOLDERS_DEPTH } from '@/folders/libs/constants';
import { FoldersProcessService } from '@/folders/infrastructure/folders-process.service';
import { IFoldersTreeNode } from '@/folders/libs/interfaces/folders-tree-node.interface';
import { isPrismaUniqueError } from './libs/is-prisma-unique-error';

@Injectable()
export class FoldersService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly foldersRepository: FoldersRepository,
    private readonly foldersProcess: FoldersProcessService,
  ) {}

  /**
   * Create folder
   * @param dto
   * @param userId
   */
  async create(userId: string, dto: CreateFolderDto) {
    const parentId = dto.parentId ?? null;
    const isRoot = parentId !== null;

    if (parentId !== null) {
      await this.validateDepth(userId, parentId);
    } else {
      // to prevent duplication on the root lvl
      const isNameUsed = await this.isNameUsed(dto.name, userId, parentId);
      if (isNameUsed) {
        throw new BadRequestException(
          'Folder name must be unique within the same parent',
        );
      }
    }

    try {
      return await this.prismaService.folders.create({
        data: {
          name: dto.name,
          user: {
            connect: { id: userId },
          },
          ...(isRoot && {
            parent: {
              connect: { id: parentId },
            },
          }),
        },
      });
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new BadRequestException(
          'Folder name must be unique within the same parent',
        );
      }

      throw error;
    }
  }

  /**
   * Return folder tree
   * @param userId
   * @param folderId
   */
  async getTree(userId: string, folderId: string): Promise<IFoldersTreeNode[]> {
    const folders = await this.foldersRepository.getTreeAsc(userId, folderId);

    if (!folders) {
      throw new NotFoundException('Folder not found');
    }

    return await this.foldersProcess.buildTree(folders);
  }

  /**
   * Get folder by id
   * @param userId
   * @param id
   */
  async getById(userId: string, id: string): Promise<Folders> {
    const folder = await this.prismaService.folders.findUnique({
      where: { id, userId },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return folder;
  }

  /**
   * Rename folder
   * @param userId
   * @param id
   * @param dto
   */
  async update(
    userId: string,
    id: string,
    dto: { name?: string; parentId?: string },
  ): Promise<any> {
    if (dto.parentId?.length && id === dto.parentId) {
      throw new BadRequestException('Cannot move folder into itself');
    }

    if (dto.parentId?.length) {
      await this.validateDepth(userId, dto.parentId);

      // to prevent cyclical dependency
      const isAncestor = await this.foldersProcess.isAncestor(
        id,
        dto.parentId,
        userId,
      );
      if (isAncestor) {
        throw new NotFoundException('Cannot move folder into its child');
      }
    }

    try {
      const result = await this.prismaService.folders.updateMany({
        where: { id, userId },
        data: dto,
      });
      if (result.count === 0) {
        throw new NotFoundException('Folder not found');
      }
      return result;
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new BadRequestException(
          'Folder name must be unique within the same parent',
        );
      }

      throw error;
    }
  }

  /**
   * Delete folder
   * @param userId
   * @param id
   */
  async remove(userId: string, id: string) {
    /**
     * check is folder has children
     */
    const hasChildren = await this.foldersRepository.getTreeDesc(userId, id);
    if (hasChildren) {
      throw new BadRequestException('Cannot remove folder that has children.');
    }

    /**
     * check is folder has linked files
     */
    const linkedFile = await this.prismaService.files.findFirst({
      where: { folderId: id, userId },
    });
    if (linkedFile) {
      throw new BadRequestException('Cannot remove folder that contain files.');
    }

    /**
     * Now user can delete only empty folder.
     * In the future, it can be changed.
     */
    return this.prismaService.folders.delete({
      where: { id },
    });
  }

  private async isNameUsed(
    name: string,
    userId: string,
    parentId: string | null,
  ): Promise<boolean> {
    const sibling = await this.prismaService.folders.findFirst({
      where: { name, userId, parentId },
    });
    return sibling?.id !== undefined;
  }

  private async validateDepth(userId: string, parentId: string): Promise<void> {
    const depth = await this.foldersRepository.getFolderDepth(userId, parentId);
    if (depth + 1 >= MAX_FOLDERS_DEPTH) {
      throw new BadRequestException(
        `Nesting limit reached, maximum nesting depth: ${MAX_FOLDERS_DEPTH}`,
      );
    }
  }
}
