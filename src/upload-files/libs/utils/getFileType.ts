/**
 * Returns top level mime type (image, video, ...)
 * @param mime
 * @private
 */
export function getFileType(mime: string): string {
  return mime.split('/')[0]?.toLowerCase() ?? '';
}
