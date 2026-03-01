import type { Folders } from '@db/__generated__/client';

export interface IFoldersChildNode extends Pick<
  Folders,
  'id' | 'parentId' | 'name'
> {}
