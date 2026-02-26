import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma-provider/prisma.service';
import { Folders } from '@db/__generated__/client';

@Injectable()
export class FoldersRepository {
  public constructor(private prismaService: PrismaService) {}

  public async getTreeAsc(folderId: string): Promise<Folders[] | null> {
    return this.prismaService.$queryRaw<Folders[]>`
      WITH RECURSIVE folder_tree AS (
        SELECT parent_id, id, name, 0 as nest
        FROM folders
        WHERE id = ${folderId}

        UNION ALL

        SELECT f.parent_id, f.id, f.name, ft.nest + 1
        FROM folders f
               INNER JOIN folder_tree ft ON ft.parent_id = f.id
      )
      SELECT ft.parent_id, ft.id, ft.name, (SELECT MAX(nest) FROM folder_tree) - nest AS dep
      FROM folder_tree ft
      ORDER BY dep;
    `;
  }

  public async getTreeDesc(folderId: string): Promise<Folders[] | null> {
    const initDepth = await this.getFolderDepth(folderId);
    console.log('initDepth', initDepth);
    return this.prismaService.$queryRaw<Folders[]>`
      WITH RECURSIVE folder_tree AS (
        SELECT parent_id, id, name, ${initDepth}::int as dep FROM folders WHERE id = ${folderId} 
                              
        UNION ALL
        
        SELECT f.parent_id, f.id, f.name, dep + 1 FROM folders f
            INNER JOIN folder_tree ft ON f.parent_id = ft.id
      )
      SELECT * FROM folder_tree ORDER BY dep;
    `;
  }

  // public async getTreeDesc(folderId: string): Promise<Folders[] | null> {
  //   return this.prismaService.$queryRaw`
  //     WITH RECURSIVE parent_tree AS (
  //       SELECT id, parent_id, 0 as dep
  //       FROM folders
  //       WHERE id = ${folderId}
  //
  //       UNION ALL
  //
  //       SELECT f.id, f.parent_id, pt.dep + 1
  //       FROM folders f
  //              INNER JOIN parent_tree pt ON pt.parent_id = f.id
  //     ),
  //     depth_to_root AS (
  //       SELECT MAX(dep) as base_depth FROM parent_tree
  //     ),
  //     folder_tree AS (
  //       SELECT f.parent_id, f.id, f.name, 0 as dep FROM folders f WHERE f.id = ${folderId}
  //
  //       UNION ALL
  //
  //       SELECT child.parent_id, child.id, child.name, ft.dep + 1 FROM folders child
  //             INNER JOIN folder_tree ft ON child.parent_id = ft.id
  //     )
  //     SELECT
  //       ft.parent_id, ft.id, ft.name, ft.dep + d.base_depth as real_depth
  //     FROM folder_tree ft
  //            CROSS JOIN depth_to_root d
  //     ORDER BY real_depth;
  //   `;
  // }

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
