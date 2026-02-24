import { Module } from '@nestjs/common';
import { UploadFilesService } from './upload-files.service';
import { UploadFilesController } from './upload-files.controller';
import { UploadFilesInfrastructureModule } from '@/upload-files/infrastructure/upload-files-infrastructure.module';

@Module({
  imports: [UploadFilesInfrastructureModule],
  controllers: [UploadFilesController],
  providers: [UploadFilesService],
})
export class UploadFilesModule {}
