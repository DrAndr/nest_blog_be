import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateFolderDto } from './create-folder.dto';
import { PickType } from '@nestjs/mapped-types';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateFolderDto extends PickType(CreateFolderDto, ['parentId']) {
  @ApiProperty({
    example: 'folder-name',
    description: 'Folder name',
    required: false,
    minLength: 1,
    maxLength: 20,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  name?: string;
}
