import { PrismaService } from '@/infrastructure/prisma-provider/prisma.service';
import { CreateCategoryDto } from '@/categories/dto/create-category.dto';
import { UpdateCategoryDto } from '@/categories/dto/update-category.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CategoryResponseDto } from '@/categories/dto/category-response.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    return this.prisma.category.create({ data: dto });
  }

  async findAll(): Promise<CategoryResponseDto[]> {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async update(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<boolean> {
    const postsCount = await this.prisma.post.count({
      where: { categoryId: id },
    });

    if (postsCount > 0) {
      throw new BadRequestException('Category is not empty');
    }

    const result = await this.prisma.category.delete({ where: { id } });

    return !result;
  }
}
