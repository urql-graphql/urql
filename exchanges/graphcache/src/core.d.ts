import { Client as BaseClient } from '@urql/core';
import { Cache } from './types';

declare module '@urql/core' {
  export interface Client extends BaseClient {
    cache: Cache;
  }
}
