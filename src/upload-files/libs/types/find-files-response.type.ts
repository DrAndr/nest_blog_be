import type { Files, FileVariants } from '@db/__generated__/client';

export type TFindFilesResponse = Files & { variants: FileVariants[] };
