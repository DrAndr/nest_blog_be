import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PublicUserDto {
  @ApiProperty({
    example: 'a03b84c8-2f85-4b15-a6bd-bfb9489fd0ff',
    description: 'User id.',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    example: 'email@google.com',
    description: 'User email.',
  })
  @Expose()
  email!: string;

  @ApiProperty({
    example: 'John',
    description: 'User name.',
  })
  @Expose()
  name!: string;

  @ApiProperty({
    example: '/publick/user/avatar.png',
    description: 'User image.',
  })
  @Expose()
  image!: string;

  @ApiProperty({
    example: 'REGULAR',
    description: 'User role.',
  })
  @Expose()
  role!: string;

  @ApiHideProperty()
  @Expose()
  message?: string;
}
