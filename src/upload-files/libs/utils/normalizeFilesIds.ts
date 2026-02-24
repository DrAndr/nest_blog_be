/**
 * Normalizes single id or array of ids into string[]
 */
export function normalizeIds(id: string | string[]): string[] {
  if (Array.isArray(id)) {
    return id;
  }

  return [id.trim()];
}
