import { Module } from '@nestjs/common';
import { UploadFilesService } from './upload-files.service';
import { UploadFilesController } from './upload-files.controller';

@Module({
  imports: [],
  controllers: [UploadFilesController],
  providers: [UploadFilesService],
})
export class UploadFilesModule {}
