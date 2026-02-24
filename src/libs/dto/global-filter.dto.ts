import {
  FilterOperationType,
  type FilterOrder,
  GeneratedFindOptions,
  IFilter,
  IGeneratedFilter,
  ISingleFilter,
  ISingleOrder,
} from '@chax-at/prisma-filter';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * https://github.com/chax-at/prisma-filter?tab=readme-ov-file
 */

// The fields are also validated in filter.parser.ts to make sure that only correct fields are used to filter
export class SingleFilter<T> implements ISingleFilter<T> {
  @IsString()
  field!: keyof T & string;

  @IsEnum(FilterOperationType)
  type!: FilterOperationType;

  @IsDefined()
  value: any;
}

// type for the ordering param ... order[0][field]=name&order[0][dir]=asc ...
export class SingleFilterOrder<T> implements ISingleOrder<T> {
  @ApiProperty({
    example: 'field=id',
    description: 'Sorting field',
    required: false,
  })
  @IsString()
  field!: keyof T & string;

  @ApiProperty({
    example: 'dir=desc',
    description: 'Sorting value',
    required: false,
  })
  @IsIn(['asc', 'desc'])
  dir!: FilterOrder;
}
// main filter params
export class Filter<T = any> implements IFilter<T> {
  @ApiProperty({
    example: '[{field:"size", type:"==", value:"5555"}, etc...]',
    description: 'Filtering params.',
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleFilter)
  @IsOptional()
  filter?: Array<SingleFilter<T>>;

  @ApiProperty({
    example: [
      { field: 'createdAt', dir: 'asc' },
      { field: 'id', dir: 'desc' },
    ],
    description: 'Ordering params.',
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleFilterOrder)
  @IsOptional()
  order?: Array<SingleFilterOrder<T>>;

  @ApiProperty({
    example: { offset: 0 },
    description: 'Offset of number rows.',
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;

  @ApiProperty({
    example: '100',
    description: 'Limit of number rows.',
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit = 20;
}

/**
 * @chax-at/prisma-filter
 * Query string example: http://localhost:3000/uploads?offset=10&limit=10
 * &filter[0][field]=extension
 *    &filter[0][type]==
 *    &filter[0][value]=png
 * &filter[1][field]=originalname
 *    &filter[1][type]=like
 *    &filter[1][value]=%Image name%
 * &order[0][field]=originalname&order[0][dir]=asc
 */

export class FilterDto<TWhereInput>
  extends Filter
  implements IGeneratedFilter<TWhereInput>
{
  // This will be set by filter pipe
  findOptions!: GeneratedFindOptions<TWhereInput>;
}
