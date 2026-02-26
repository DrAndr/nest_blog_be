import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFolderDto {
  @ApiProperty({
    example: 'folder-name',
    description: 'Folder name',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  name!: string;

  @ApiProperty({
    example: '00000000-b0b0-000b0-000e-00a00f0000ab',
    description: 'Parent folder id',
    required: false,
  })
  @IsString()
  @IsOptional()
  parentId?: string;
}
