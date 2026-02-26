import { Module } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { FoldersRepository } from '@/folders/folders.repository';

@Module({
  controllers: [FoldersController],
  providers: [FoldersService, FoldersRepository],
})
export class FoldersModule {}
