import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { PrismaService } from '@/infrastructure/prisma-provider/prisma.service';
import { Folders } from '@db/__generated__/client';
import { Prisma } from '@prisma/client';
import { FoldersRepository } from '@/folders/folders.repository';
import { MAX_FOLDERS_DEPTH } from '@/folders/libs/constants';

@Injectable()
export class FoldersService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly foldersRepository: FoldersRepository,
  ) {}

  /**
   * Create folder
   * @param dto
   */
  async create(dto: CreateFolderDto) {
    const parentId = dto.parentId ?? null;

    if (parentId?.length) {
      const depth = await this.foldersRepository.getFolderDepth(parentId);
      if (depth + 1 >= MAX_FOLDERS_DEPTH) {
        throw new BadRequestException(
          `Nesting limit reached, maximum nesting depth: ${MAX_FOLDERS_DEPTH}`,
        );
      }
    }

    return this.prismaService.folders.create({
      data: {
        name: dto.name,
        parentId: parentId,
      },
    });
  }

  /**
   * Return folder tree
   * @param folderId
   */
  async getTree(folderId: string): Promise<string> {
    const folders = await this.foldersRepository.getTreeAsc(folderId);

    if (!folders) {
      throw new NotFoundException('Folder not found');
    }
    // TODO:
    // build nested structure manually
    // return hierarchical JSON

    return JSON.stringify(folders);
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
    if (id === dto.parentId) {
      throw new BadRequestException('Cannot move folder into itself');
    }

    // TODO:
    //  - check is name uniq on current or new depth lvl
    //  - check is dto.parentId passed
    //  - check is dto.parentId exist and is not child of this folder (cycle detection)

    return this.prismaService.folders.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Delete folder
   * @param id
   */
  async remove(id: string) {
    const hasChildren = await this.foldersRepository.getTreeDesc(id);
    if (hasChildren) {
      throw new NotFoundException('Cannot remove folder that has children.');
    }

    const linkedFile = await this.prismaService.files.findFirst({
      where: { folderId: id },
    });

    if (linkedFile) {
      throw new NotFoundException('Cannot remove folder that contain files.');
    }

    return this.prismaService.folders.delete({
      where: { id },
    });
  }

  /**
   private buildTree(folders: Folders[]) {
   const map = new Map<string, any>();

   folders.forEach(folder => {
   map.set(folder.id, { ...folder, children: [] });
   });

   let root = null;

   folders.forEach(folder => {
   if (folder.parentId) {
   map.get(folder.parentId)?.children.push(
   map.get(folder.id),
   );
   } else {
   root = map.get(folder.id);
   }
   });

   return root;
   }
   */
}
