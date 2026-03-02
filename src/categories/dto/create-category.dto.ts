import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsJSON,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'category-name',
    description: 'Category name',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(80)
  name;

  @ApiProperty({
    example: 'category-slug',
    description: 'Category slug',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  slug;

  @ApiProperty({
    example: 'category-description',
    description: 'Category description',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @MaxLength(4000)
  description;

  @ApiProperty({
    example: 'category-excerpt',
    description: 'Category short description',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  excerpt;

  @ApiProperty({
    example: '{"seo-tag": "category-meta"}',
    description: 'Category meta',
    nullable: true,
  })
  @IsJSON()
  @IsOptional()
  @MaxLength(4000)
  metaData;

  @ApiProperty({
    example: '/uploads/images/category-thumbnail.jpg',
    description: 'Category thumbnail',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  thumbnail?;

  @ApiProperty({
    example: 'uuid-v4',
    description: 'User id',
  })
  @IsString()
  @MaxLength(40)
  userId;

  @ApiProperty({
    example: 'uuid-v4',
    description: 'Parent category id',
  })
  @IsString()
  @MaxLength(40)
  parentId;

  @ApiProperty({
    example: 'true',
    description: 'Is category active',
  })
  @IsBoolean()
  isActive;
}
