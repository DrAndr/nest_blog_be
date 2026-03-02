import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { Authorization } from '@/auth/presentation/decorators/authorization.decorator';
import { Authorized } from '@/auth/presentation/decorators/authorized.decorator';
import { UserRole } from '@db/__generated__/enums';
import { Prisma } from '@db/__generated__/client';
import { DirectFilterPipe } from '@chax-at/prisma-filter';
import { FilterDto } from '@/libs/dto/global-filter.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('blog/posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // CREATE (draft by default)

  @ApiOperation({ summary: 'Create blog post (draft by default)' })
  @ApiBody({ type: CreatePostDto })
  @ApiResponse({ status: 201, description: 'Post created' })
  @Authorization(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  create(@Authorized('id') userId: string, @Body() dto: CreatePostDto) {
    return this.postsService.create(userId, dto);
  }

  // GET LIST (public sees only PUBLISHED)

  @ApiOperation({ summary: 'Get blog posts' })
  @ApiResponse({ status: 200, description: 'List of posts' })
  @Get()
  findAll(
    @Query(
      new DirectFilterPipe<any, Prisma.PostWhereInput>(
        [
          'id',
          'title',
          'slug',
          'status',
          'categoryId',
          'userId',
          'publishedAt',
          'createdAt',
        ],
        ['category.slug', 'author.email'],
        [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      ),
    )
    filterDto: FilterDto<Prisma.PostWhereInput>,
  ) {
    return this.postsService.findAll(filterDto.findOptions);
  }

  @ApiOperation({ summary: 'Get post by slug' })
  @ApiParam({ name: 'slug', example: 'how-to-build-nestjs-blog' })
  @ApiResponse({ status: 200, description: 'Post found' })
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.postsService.findPublishedBySlug(slug);
  }

  @ApiOperation({ summary: 'Update blog post' })
  @ApiParam({ name: 'id', example: 'uuid-post-id' })
  @ApiBody({ type: UpdatePostDto })
  @ApiResponse({ status: 200, description: 'Post updated' })
  @Authorization(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id')
  update(
    @Authorized('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(userId, id, dto);
  }

  @ApiOperation({ summary: 'Publish post' })
  @ApiParam({ name: 'id', example: 'uuid-post-id' })
  @ApiResponse({ status: 200, description: 'Post published' })
  @Authorization(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.postsService.publish(id);
  }

  @ApiOperation({ summary: 'Archive post' })
  @Authorization(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/archive')
  archive(@Param('id') id: string) {
    return this.postsService.archive(id);
  }

  @ApiOperation({ summary: 'Delete post' })
  @Authorization(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }
}
