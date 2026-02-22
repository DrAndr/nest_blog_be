import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { FileVariants } from '@db/__generated__/client';

export class UpdateFileDto {
  @ApiProperty({ example: 'Mona Liza', description: 'New file name.' })
  @IsOptional()
  @IsString({ message: 'Should be a string.' })
  originalname?: string;

  @ApiProperty({ example: 'folder_id', description: 'New folder.' })
  @IsOptional()
  @IsString({ message: 'Should be a string.' })
  folderId?: string;

  @ApiProperty({ example: 'true', description: 'New file privacy status.' })
  @IsOptional()
  @IsString({ message: 'Should be a string.' })
  isPrivate?: boolean;
}
