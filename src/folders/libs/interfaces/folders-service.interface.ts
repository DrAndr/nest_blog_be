import { CreateFolderDto } from '@/folders/dto/create-folder.dto';
import { Folders } from '@db/__generated__/client';

export interface IFoldersService {
  create(dto: CreateFolderDto): Promise<Folders>;
  getTree(id: string);
  getById(id: string): Promise<Folders>;
  update();
  move();
  remove();
}
