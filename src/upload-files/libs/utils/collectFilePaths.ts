import { Files } from '@db/__generated__/client';

/**
 * Collects original file and all variant paths
 * @param file
 */
export function collectFilePaths(file: Files & { variants: any[] }): string[] {
  const variantPaths = file.variants?.map((v) => v.filePath) ?? [];
  return [file.filePath, ...variantPaths].filter(Boolean);
}
