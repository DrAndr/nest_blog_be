import { CreateFolderDto } from '@/folders/dto/create-folder.dto';
import { Folders } from '@db/__generated__/client';
import { GetParentsResponseDto } from '@/folders/dto/get-parents-response.dto';
import { UpdateFolderDto } from '@/folders/dto/update-folder.dto';
import { BatchPayload } from '@db/__generated__/internal/prismaNamespace';
import { GetChildrenResponseDto } from '@/folders/dto/get-children-response.dto';

export interface IFoldersService {
  create(userId: string, dto: CreateFolderDto): Promise<Folders>;
  getParents(
    userId: string,
    folderId: string,
  ): Promise<GetParentsResponseDto[]>;
  getChildren(
    userId: string,
    parentId: string,
  ): Promise<GetChildrenResponseDto[]>;
  getById(userId: string, id: string): Promise<Folders>;
  update(
    userId: string,
    id: string,
    dto: UpdateFolderDto,
  ): Promise<BatchPayload>;
  remove(userId: string, id: string): Promise<Folders>;
}
