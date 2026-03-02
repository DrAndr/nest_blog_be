import { UpdatePostDto } from '@/posts/dto/update-post.dto';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreatePostDto } from '@/posts/dto/create-post.dto';
import { PrismaService } from '@/infrastructure/prisma-provider/prisma.service';
import { Prisma } from '@db/__generated__/client';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        ...dto,
        status: 'DRAFT',
        userId: userId,
      },
    });
  }

  async findAll(findOptions: Prisma.PostFindManyArgs) {
    return this.prisma.post.findMany({
      ...findOptions,
      include: {
        category: true,
        user: true,
      },
    });
  }

  async findPublishedBySlug(slug: string) {
    return this.prisma.post.findFirstOrThrow({
      where: {
        slug,
        status: 'PUBLISHED',
      },
      include: {
        category: true,
        user: true,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUniqueOrThrow({ where: { id } });

    if (post.userId !== userId) {
      throw new ForbiddenException();
    }

    return this.prisma.post.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  async publish(id: string) {
    return this.prisma.post.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  }

  async archive(id: string) {
    return this.prisma.post.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
      },
    });
  }

  async remove(id: string) {
    return this.prisma.post.delete({ where: { id } });
  }
}
