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
    example: 'uuid-v4',
    description: 'Parent folder id',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  parentId?: string;
}
