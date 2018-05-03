import { IQueryResponse } from './../modules/client';
import { ICache } from './cache';
import { IQuery } from './query';

export interface IClient {
  cache: ICache;
  executeQuery(
    queryObject: IQuery,
    skipCache: boolean
  ): Promise<IQueryResponse>;
  executeMutation(mutationObject: IQuery): Promise<object>;
  refreshAllFromCache(): void;
  subscribe(
    callback: (changedTypes: string[], reponse: object) => void
  ): () => void;
}
