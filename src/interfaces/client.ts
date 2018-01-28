import { IQueryResponse } from './../modules/client';
import { ICache } from './cache';
import { IMutation } from './mutation';
import { IQuery } from './query';

export interface IClient {
  cache: ICache;
  executeQuery(
    queryObject: IQuery,
    skipCache: boolean
  ): Promise<IQueryResponse>;
  executeMutation(mutationObject: IMutation): Promise<object[]>;
  refreshAllFromCache(): void;
  subscribe(
    callback: (changedTypes: string[], reponse: object) => void
  ): string;
  unsubscribe(id: string): void;
}
