import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma-provider/prisma.service';
import { Folders } from '@db/__generated__/client';

@Injectable()
export class FoldersRepository {
  public constructor(private prismaService: PrismaService) {}

  public async getTreeAsc(
    userId: string,
    folderId: string,
  ): Promise<Folders[] | null> {
    return this.prismaService.$queryRaw<Folders[]>`
      WITH RECURSIVE folder_tree AS (
        SELECT id, parent_id, name, user_id, 0 as nest
        FROM folders
        WHERE id = ${folderId} AND user_id = ${userId}

        UNION ALL

        SELECT f.id, f.parent_id, f.name, ft.nest + 1
        FROM folders f
               INNER JOIN folder_tree ft ON ft.parent_id = f.id AND ft.user_id = = f.user_id
      )
      SELECT ft.id, ft.parent_id as parentId, ft.name, (SELECT MAX(nest) FROM folder_tree) - nest AS depth
      FROM folder_tree ft
      ORDER BY depth;
    `;
  }

  public async getTreeDesc(
    userId: string,
    folderId: string,
  ): Promise<Folders[] | null> {
    const initDepth = await this.getFolderDepth(userId, folderId);

    return this.prismaService.$queryRaw<Folders[]>`
      WITH RECURSIVE folder_tree AS (
        SELECT parent_id, id, name, user_id, ${initDepth}::int as depth FROM folders 
            WHERE id = ${folderId}  AND user_id = ${userId}
                              
        UNION ALL
        
        SELECT f.parent_id, f.id, f.name, depth + 1 FROM folders f
            INNER JOIN folder_tree ft ON f.parent_id = ft.id AND ft.user_id = f.user_id
      )
      SELECT id, ft.parent_id, name as parentId FROM folder_tree ft ORDER BY depth;
    `;
  }

  public async getFolderDepth(
    userId: string,
    folderId: string,
  ): Promise<number> {
    const result = await this.prismaService.$queryRaw<number>`
      WITH RECURSIVE folder_tree AS (
        SELECT parent_id, id, 0 as depth FROM folders WHERE id = ${folderId} AND user_id = ${userId}

        UNION ALL

        SELECT  f.parent_id, f.id, depth + 1 FROM folders f
        INNER JOIN folder_tree ft ON ft.parent_id = f.id
      )
      SELECT max(depth) AS depth FROM folder_tree;
    `;

    return result[0]?.depth ?? 0;
  }
}
