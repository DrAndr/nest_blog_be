import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma-provider/prisma.service';
import { Folders } from '@db/__generated__/client';

@Injectable()
export class FoldersRepository {
  public constructor(private prismaService: PrismaService) {}

  public async getTreeAsc(folderId: string): Promise<Folders[] | null> {
    return this.prismaService.$queryRaw<Folders[]>`
      WITH RECURSIVE folder_tree AS (
        SELECT id, parent_id, name, 0 as nest
        FROM folders
        WHERE id = ${folderId}

        UNION ALL

        SELECT f.id, f.parent_id, f.name, ft.nest + 1
        FROM folders f
               INNER JOIN folder_tree ft ON ft.parent_id = f.id
      )
      SELECT ft.id, ft.parent_id as parentId, ft.name, (SELECT MAX(nest) FROM folder_tree) - nest AS dep
      FROM folder_tree ft
      ORDER BY dep;
    `;
  }

  public async getTreeDesc(folderId: string): Promise<Folders[] | null> {
    const initDepth = await this.getFolderDepth(folderId);

    return this.prismaService.$queryRaw<Folders[]>`
      WITH RECURSIVE folder_tree AS (
        SELECT parent_id, id, name, ${initDepth}::int as dep FROM folders WHERE id = ${folderId} 
                              
        UNION ALL
        
        SELECT f.parent_id, f.id, f.name, dep + 1 FROM folders f
            INNER JOIN folder_tree ft ON f.parent_id = ft.id
      )
      SELECT id, ft.parent_id, name as parentId FROM folder_tree ft ORDER BY dep;
    `;
  }

  public async getFolderDepth(folderId: string): Promise<number> {
    const result = await this.prismaService.$queryRaw<number>`
      WITH RECURSIVE folder_tree AS (
        SELECT parent_id, id, 0 as dep FROM folders WHERE id = ${folderId}

        UNION ALL

        SELECT  f.parent_id, f.id, dep + 1 FROM folders f
        INNER JOIN folder_tree ft ON ft.parent_id = f.id
      )
      SELECT max(dep) AS dep FROM folder_tree;
    `;

    return result[0]?.dep ?? 0;
  }
}
