import { ApiProperty } from '@nestjs/swagger';

export class GetParentsResponseDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Documents' })
  name!: string;

  @ApiProperty({
    example: 'uuid',
    nullable: true,
  })
  parentId!: string | null;

  @ApiProperty({
    type: () => GetParentsResponseDto,
    isArray: true,
    example: [],
  })
  children!: GetParentsResponseDto[];
}
