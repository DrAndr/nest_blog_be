import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFiles,
  Req,
  Query,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UploadFilesService } from './upload-files.service';
import { UpdateFileDto } from './dto/update-file.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Authorization } from '@/auth/presentation/decorators/authorization.decorator';
import { Authorized } from '@/auth/presentation/decorators/authorized.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Prisma } from '@db/__generated__/client';
import { DirectFilterPipe } from '@chax-at/prisma-filter';
import { FilterDto } from '@/libs/dto/global-filter.dto';

@Controller('upload')
export class UploadFilesController {
  constructor(private readonly uploadFilesService: UploadFilesService) {}

  @ApiOperation({ summary: 'Upload files' })
  @ApiResponse({
    status: 201,
    description: 'Upload files, and link them with user.',
  })
  @Authorization()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('files'))
  @Post()
  create(
    @UploadedFiles() files: Express.Multer.File[],
    @Authorized('id') userId: string,
    @Body('folder') folderId?: string,
  ) {
    return this.uploadFilesService.create(files, userId, folderId);
  }

  @ApiOperation({ summary: 'Get files' })
  @ApiResponse({
    status: 201,
    description: 'Get files.',
  })
  @Get()
  findAll(
    @Query(
      new DirectFilterPipe<any, Prisma.FilesWhereInput>(
        [
          'id',
          'userId',
          'isPublic',
          'folderId',
          'extension',
          'name',
          'mimeType',
          'size',
          'width',
          'height',
          'dominantColor',
          'createdAt',
        ],
        [
          /*'variant.type', 'variant.size', 'user.name', 'folder.name'*/
        ],
        [{ createdAt: 'asc' }, { id: 'asc' }],
      ),
    )
    filterDto: FilterDto<Prisma.FilesWhereInput>,
  ) {
    return this.uploadFilesService.findAll(filterDto.findOptions);
  }

  @ApiOperation({ summary: 'Get file' })
  @ApiResponse({
    status: 201,
    description: 'Get file by ID.',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.uploadFilesService.findOne(id);
  }

  @ApiOperation({ summary: 'Update file metadata' })
  @ApiResponse({
    status: 201,
    description: 'Update file metadata.',
  })
  @Authorization()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFileDto: UpdateFileDto) {
    return this.uploadFilesService.update(id, updateFileDto);
  }

  @ApiOperation({ summary: 'Delete file.' })
  @ApiResponse({
    status: 201,
    description: 'Delete file.',
  })
  @Authorization()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.uploadFilesService.remove(id);
  }
}
