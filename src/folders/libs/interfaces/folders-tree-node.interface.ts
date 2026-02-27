import type { Folders } from '@db/__generated__/client';

export interface IFoldersTreeNode extends Partial<Folders> {
  children: IFoldersTreeNode[];
}
