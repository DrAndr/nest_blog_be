import slugify from 'slugify';
import type { PrismaClient } from '@prisma/client';

export default async function generateSlug(
  input: string,
  entity: PrismaClient,
  suffix: number = 0,
): Promise<string> {
  const baseSlug = slugify(input, {
    lower: true,
    strict: true,
    trim: true,
  });

  const slug = suffix === 0 ? baseSlug : `${baseSlug}-${suffix}`;

  const existingRecord = await entity.findUnique({
    where: { slug },
  });

  if (!existingRecord) {
    return slug;
  }

  return generateSlug(input, entity, suffix + 1);
}
