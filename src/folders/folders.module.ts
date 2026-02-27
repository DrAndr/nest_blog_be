import { Module } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { FoldersRepository } from '@/folders/folders.repository';
import { foldLines } from 'nodemailer/lib/mime-funcs';
import { FoldersProcessService } from '@/folders/infrastructure/folders-process.service';

@Module({
  controllers: [FoldersController],
  providers: [FoldersService, FoldersRepository, FoldersProcessService],
})
export class FoldersModule {}
