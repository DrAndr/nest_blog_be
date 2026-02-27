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
   */
  async create(dto: CreateFolderDto) {
    const parentId = dto.parentId ?? null;

    if (parentId?.length) {
      await this.validateDepth(parentId);
    }

    try {
      return await this.prismaService.folders.create({
        data: {
          name: dto.name,
          parentId: parentId,
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
   * @param folderId
   */
  async getTree(folderId: string): Promise<IFoldersTreeNode[]> {
    const folders = await this.foldersRepository.getTreeAsc(folderId);

    if (!folders) {
      throw new NotFoundException('Folder not found');
    }

    return await this.foldersProcess.buildTree(folders);
  }

  /**
   * Get folder by id
   * @param id
   */
  async getById(id: string): Promise<Folders> {
    const folder = await this.prismaService.folders.findUnique({
      where: { id },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return folder;
  }

  /**
   * Rename folder
   * @param id
   * @param dto
   */
  async update(
    id: string,
    dto: { name?: string; parentId?: string },
  ): Promise<any> {
    if (dto.parentId?.length && id === dto.parentId) {
      throw new BadRequestException('Cannot move folder into itself');
    }

    if (dto.parentId?.length) {
      await this.validateDepth(dto.parentId);

      // to prevent cyclical dependency
      const isAncestor = await this.foldersProcess.isAncestor(id, dto.parentId);
      if (isAncestor) {
        throw new NotFoundException('Cannot move folder into its child');
      }
    }

    try {
      return await this.prismaService.folders.update({
        where: { id },
        data: dto,
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
   * Delete folder
   * @param id
   */
  async remove(id: string) {
    /**
     * check is folder has children
     */
    const hasChildren = await this.foldersRepository.getTreeDesc(id);
    if (hasChildren) {
      throw new BadRequestException('Cannot remove folder that has children.');
    }

    /**
     * check is folder has linked files
     */
    const linkedFile = await this.prismaService.files.findFirst({
      where: { folderId: id },
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

  private async validateDepth(parentId: string): Promise<void> {
    const depth = await this.foldersRepository.getFolderDepth(parentId);
    if (depth + 1 >= MAX_FOLDERS_DEPTH) {
      throw new BadRequestException(
        `Nesting limit reached, maximum nesting depth: ${MAX_FOLDERS_DEPTH}`,
      );
    }
  }
}
