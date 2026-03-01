import type { Folders } from '@db/__generated__/client';

export interface IFoldersTreeNode extends Partial<Folders> {
  depth?: number;
  children: IFoldersTreeNode[];
}
