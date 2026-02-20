import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateFileDto {
  @ApiProperty({ example: 'Mona Liza', description: 'New file name.' })
  @IsOptional()
  @IsString({ message: 'Should be a string.' })
  origin!: string; // original name
}
