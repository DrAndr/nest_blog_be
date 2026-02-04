import { UseInterceptors } from '@nestjs/common';
import { SerializeInterceptor } from '../interceptors/serialize.interceptor';
import { ClassConstructor } from 'class-transformer';

/**
 * Just a wrapper for interceptor, for improving readability
 * @param dto
 * @returns
 */
export function Serialize<T>(dto: ClassConstructor<T>) {
  return UseInterceptors(new SerializeInterceptor(dto));
}
