import { FileVariantsService } from '@/upload-files/infrastructure/file-variants.service';
import { FileStorageService } from '@/upload-files/infrastructure/file-storage.service';
import { Module } from '@nestjs/common';
import { FileProcessService } from '@/upload-files/infrastructure/file-process.service';
import { FilePathService } from '@/upload-files/infrastructure/file-path.service';

@Module({
  providers: [
    FileStorageService,
    FileProcessService,
    FileVariantsService,
    FilePathService,
  ],
  exports: [
    FileStorageService,
    FileProcessService,
    FileVariantsService,
    FilePathService,
  ],
})
export class UploadFilesInfrastructureModule {}
