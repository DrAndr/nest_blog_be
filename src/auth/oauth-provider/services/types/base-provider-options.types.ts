import { TypeProviderOptions } from './provider-options.types';

export type TypeBaseProviderOptions = TypeProviderOptions & {
  name: string;
  authorize_url: string;
  access_url: string;
  profile_url: string;
};
