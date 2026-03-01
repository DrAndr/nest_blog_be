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
import { IFoldersChildNode } from '@/folders/libs/interfaces/folders-child-node.interface';
import { GetChildrenResponseDto } from '@/folders/dto/get-children-response.dto';
import { GetParentsResponseDto } from '@/folders/dto/get-parents-response.dto';
import { IFoldersService } from '@/folders/libs/interfaces/folders-service.interface';
import { BatchPayload } from '@db/__generated__/internal/prismaNamespace';
import { UpdateFolderDto } from '@/folders/dto/update-folder.dto';

@Injectable()
export class FoldersService implements IFoldersService {
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
  async create(userId: string, dto: CreateFolderDto): Promise<Folders> {
    const parentId = dto.parentId ?? null;
    const isRoot = parentId !== null;

    if (parentId !== null) {
      await this.foldersProcess.validateDepth(userId, parentId);
    } else {
      // to prevent duplication on the root lvl
      const isNameUsed = await this.foldersProcess.isNameUsed(
        dto.name,
        userId,
        parentId,
      );
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
  async getParents(
    userId: string,
    folderId: string,
  ): Promise<GetParentsResponseDto[]> {
    const folders = await this.foldersRepository.getTreeAsc(userId, folderId);

    if (!folders) {
      throw new NotFoundException('Folder not found');
    }

    return await this.foldersProcess.buildTree(folders);
  }

  /**
   *
   * @param userId
   * @param parentId
   */
  async getChildren(
    userId: string,
    parentId: string,
  ): Promise<GetChildrenResponseDto[]> {
    const result = await this.prismaService.folders.findMany({
      where: { userId, parentId },
      select: { id: true, name: true, parentId: true /* user: true */ },
      // include: { user: true }, // include OR select can be used
    });

    if (!result?.length) {
      throw new NotFoundException('Children not found');
    }
    return result;
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
    dto: UpdateFolderDto,
  ): Promise<BatchPayload> {
    if (dto.parentId?.length && id === dto.parentId) {
      throw new BadRequestException('Cannot move folder into itself');
    }

    if (dto.parentId?.length) {
      await this.foldersProcess.validateDepth(userId, dto.parentId);

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
}
