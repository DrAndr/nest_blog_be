import { Prisma } from '@prisma/client';

export const getTreeAscSql = `
--     WITH RECURSIVE folder_tree AS (
--       SELECT *
--       FROM folders
--       WHERE id = $1
-- 
--       UNION ALL
-- 
--       SELECT f.*
--       FROM folders f
--       INNER JOIN folder_tree ft ON ft.parent_id = f.id
--     )
--     SELECT * FROM folder_tree;
  `;
