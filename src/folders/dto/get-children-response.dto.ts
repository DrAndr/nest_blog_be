import { ApiProperty } from '@nestjs/swagger';

export class GetChildrenResponseDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Documents' })
  name!: string;

  @ApiProperty({
    example: 'uuid',
    nullable: true,
  })
  parentId!: string | null;
}
