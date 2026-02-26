import { Injectable } from '@nestjs/common';
import { FoldersService } from '@/folders/folders.service';
import { PrismaService } from '@/infrastructure/prisma-provider/prisma.service';
import { CreateFolderDto } from '@/folders/dto/create-folder.dto';

@Injectable()
export class FoldersProcessService {
  constructor(private prismaService: PrismaService) {}

  public async defineDepth(parentId: string): Promise<string> {
    return '';
  }
}
