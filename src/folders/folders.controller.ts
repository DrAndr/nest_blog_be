import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

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
    status: 201,
    description: 'Folder successfully created',
    example: {
      id: 'uuid',
      name: 'Documents',
      parentId: null,
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @Post()
  create(@Body() createFolderDto: CreateFolderDto) {
    return this.foldersService.create(createFolderDto);
  }

  @ApiOperation({ summary: 'Get folder tree' })
  @ApiParam({ name: 'id', example: 'uuid-folder-id' })
  @ApiResponse({
    status: 200,
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
  @ApiResponse({ status: 404, description: 'Folder not found' })
  @Get('tree/:id')
  getTree(@Param('id') id: string) {
    return this.foldersService.getTree(id);
  }

  @ApiOperation({ summary: 'Get folder by id' })
  @ApiParam({ name: 'id', example: 'uuid-folder-id' })
  @ApiResponse({
    status: 200,
    description: 'Folder found',
    example: {
      id: 'uuid',
      name: 'Documents',
      parentId: null,
    },
  })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.foldersService.getById(id);
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
    status: 200,
    description: 'Folder updated',
    example: {
      id: 'uuid',
      name: 'New Name',
      parentId: null,
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFolderDto: UpdateFolderDto) {
    return this.foldersService.update(id, updateFolderDto);
  }

  @ApiOperation({ summary: 'Delete folder' })
  @ApiParam({ name: 'id', example: 'uuid-folder-id' })
  @ApiResponse({
    status: 200,
    description: 'Folder deleted',
    example: {
      id: 'uuid',
      name: 'Documents',
      parentId: null,
    },
  })
  @ApiResponse({ status: 400, description: 'Folder not empty' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.foldersService.remove(id);
  }
}
