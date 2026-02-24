import { IServiceResponse } from '@/libs/interfaces';
import { UpdateFileDto } from '@/upload-files/dto/update-file.dto';
import { Files, Prisma } from '@db/__generated__/client';
import { MFile } from '@/upload-files/libs/MFile';

export interface IUploadFiles {
  create(files: MFile[], userId: string, folderId?: string): Promise<Files[]>;
  findAll(filterParams: Prisma.FilesFindManyArgs): Promise<Files[]>;
  findOne(id: string): Promise<Files>;
  update(id: string, updateFileDto: UpdateFileDto): Promise<Files>;
  remove(id: string | string[]): Promise<IServiceResponse>;
}
