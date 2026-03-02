import { ApiProperty } from '@nestjs/swagger';
import {
  IsJSON,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PostStatus } from '@db/__generated__/enums';

export class CreatePostDto {
  @ApiProperty({
    example: 'post-title',
    description: 'Post title',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  title!: string;

  @ApiProperty({
    example: 'post-title',
    description: 'Post title',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  slug!: string;

  @ApiProperty({
    example: 'post-content',
    description: 'Post content',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  content?: string;

  @ApiProperty({
    example: 'post-excerpt',
    description: 'Post excerpt',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  excerpt?: string;

  @ApiProperty({
    example: 'post-canonical-url',
    description: 'Post canonical Url',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  canonicalUrl?: string;

  @ApiProperty({
    example: '/uploads/images/thumbnail.webp',
    description: 'Post canonical Url',
    nullable: true,
  })
  @IsUrl()
  @IsOptional()
  @MaxLength(40)
  thumbnail?: string;

  @ApiProperty({
    example: 'PUBLISHED',
    description: 'DRAFT | PUBLISHED | ARCHIVED',
  })
  @IsString()
  @MaxLength(10)
  status!: PostStatus;

  @ApiProperty({
    example: '{"header": "Blog"}',
    description: 'Json with meta data',
  })
  @IsJSON()
  @MaxLength(2000)
  metaData?: string;

  @ApiProperty({
    example: 'uuid-v4',
    description: 'Parent folder id',
    required: false,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  categoryId?: string;
}
