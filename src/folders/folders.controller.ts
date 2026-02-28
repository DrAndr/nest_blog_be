import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Authorization } from '@/auth/presentation/decorators/authorization.decorator';
import { UserRole } from '@db/__generated__/enums';
import { Authorized } from '@/auth/presentation/decorators/authorized.decorator';

@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @ApiOperation({ summary: 'Create folder' })
  @ApiBody({
    type: CreateFolderDto,
    examples: {
      root: {
        summary: 'Create root folder',
        value: { name: 'Documents' },
      },
      nested: {
        summary: 'Create nested folder',
        value: { name: 'Photos', parentId: 'uuid-parent-id' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Folder successfully created',
    example: {
      id: 'uuid',
      name: 'Documents',
      parentId: null,
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  @Authorization(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  create(
    @Authorized('id') userId: string,
    @Body() createFolderDto: CreateFolderDto,
  ) {
    return this.foldersService.create(userId, createFolderDto);
  }

  @ApiOperation({ summary: 'Get folder tree' })
  @ApiParam({ name: 'id', example: 'uuid-folder-id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Folder tree returned',
    example: [
      {
        id: 'uuid',
        name: 'Root',
        parentId: null,
        children: [],
      },
    ],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Folder not found',
  })
  @Authorization(UserRole.ADMIN, UserRole.MANAGER)
  @Get('tree/:id')
  getTree(@Authorized('id') userId: string, @Param('id') id: string) {
    return this.foldersService.getTree(userId, id);
  }

  @ApiOperation({ summary: 'Get folder by id' })
  @ApiParam({ name: 'id', example: 'uuid-folder-id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Folder found',
    example: {
      id: 'uuid',
      name: 'Documents',
      parentId: null,
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Folder not found',
  })
  @Authorization(UserRole.ADMIN, UserRole.MANAGER)
  @Get(':id')
  findOne(@Authorized('id') userId: string, @Param('id') id: string) {
    return this.foldersService.getById(userId, id);
  }

  @ApiOperation({ summary: 'Update folder' })
  @ApiParam({ name: 'id', example: 'uuid-folder-id' })
  @ApiBody({
    type: UpdateFolderDto,
    examples: {
      rename: {
        summary: 'Rename folder',
        value: { name: 'New Name' },
      },
      move: {
        summary: 'Move folder',
        value: { parentId: 'uuid-parent-id' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Folder updated',
    example: {
      id: 'uuid',
      name: 'New Name',
      parentId: null,
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  @Authorization(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id')
  update(
    @Authorized('id') userId: string,
    @Param('id') id: string,
    @Body() updateFolderDto: UpdateFolderDto,
  ) {
    return this.foldersService.update(userId, id, updateFolderDto);
  }

  @ApiOperation({ summary: 'Delete folder' })
  @ApiParam({ name: 'id', example: 'uuid-folder-id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Folder deleted',
    example: {
      id: 'uuid',
      name: 'Documents',
      parentId: null,
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Folder not empty',
  })
  @Authorization(UserRole.ADMIN, UserRole.MANAGER)
  @Delete(':id')
  remove(@Authorized('id') userId: string, @Param('id') id: string) {
    return this.foldersService.remove(userId, id);
  }
}
