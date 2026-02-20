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
} from '@nestjs/common';
import { UploadFilesService } from './upload-files.service';
import { UpdateUploadFileDto } from './dto/update-upload-file.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Authorization } from '@/auth/presentation/decorators/authorization.decorator';
import { Authorized } from '@/auth/presentation/decorators/authorized.decorator';

@Controller('upload-files')
export class UploadFilesController {
  constructor(private readonly uploadFilesService: UploadFilesService) {}

  @ApiOperation({ summary: 'Upload files' })
  @ApiResponse({
    status: 201,
    description: 'Upload files, and link them with user.',
  })
  @Authorization()
  @Post()
  create(
    @UploadedFiles() files: Express.Multer.File[],
    @Authorized('id') userId: string,
    @Query('folder') folder?: string,
  ) {
    return this.uploadFilesService.create(files, userId, folder);
  }

  @ApiOperation({ summary: 'Get files' })
  @ApiResponse({
    status: 201,
    description: 'Get files.',
  })
  @Get()
  findAll() {
    return this.uploadFilesService.findAll();
  }

  @ApiOperation({ summary: 'Get file' })
  @ApiResponse({
    status: 201,
    description: 'Get file by ID.',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.uploadFilesService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update file metadata' })
  @ApiResponse({
    status: 201,
    description: 'Update file metadata.',
  })
  @Authorization()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUploadFileDto: UpdateUploadFileDto,
  ) {
    return this.uploadFilesService.update(+id, updateUploadFileDto);
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
