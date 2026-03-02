import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsJSON,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CategoryResponseDto {
  @ApiProperty({
    example: 'category-name',
    description: 'Category name',
    nullable: true,
  })
  id!: string;

  @ApiProperty({
    example: 'category-name',
    description: 'Category name',
    nullable: true,
  })
  name?: string | null;

  @ApiProperty({
    example: 'category-slug',
    description: 'Category slug',
  })
  slug!: string;

  @ApiProperty({
    example: 'category-description',
    description: 'Category description',
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    example: 'category-excerpt',
    description: 'Category short description',
    nullable: true,
  })
  excerpt?: string | null;

  @ApiProperty({
    example: '{"seo-tag": "category-meta"}',
    description: 'Category meta',
    nullable: true,
  })
  metaData?: string | null;

  @ApiProperty({
    example: '/uploads/images/category-thumbnail.jpg',
    description: 'Category thumbnail',
    nullable: true,
  })
  thumbnail?: string | null;

  @ApiProperty({
    example: 'uuid-v4',
    description: 'User id',
  })
  userId!: string;

  @ApiProperty({
    example: 'uuid-v4',
    description: 'Parent category id',
  })
  parentId?: string | null;

  @ApiProperty({
    example: 'true',
    description: 'Is category active',
  })
  isActive!: boolean;

  @ApiProperty({
    example: 'true',
    description: 'Is category active',
  })
  deletedAt?: Date | null;

  @ApiProperty({
    example: 'true',
    description: 'Is category active',
  })
  createdAt!: Date;

  @ApiProperty({
    example: 'true',
    description: 'Is category active',
  })
  updatedAt!: Date;
}
