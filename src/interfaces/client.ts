import { ICache } from './cache';
import { IExchangeResult } from './exchange';
import { IQuery } from './query';

export interface IClient {
  cache: ICache;
  executeQuery(
    queryObject: IQuery,
    skipCache: boolean
  ): Promise<IExchangeResult>;
  executeMutation(mutationObject: IQuery): Promise<object>;
  refreshAllFromCache(): void;
  subscribe(
    callback: (changedTypes: string[], reponse: object) => void
  ): () => void;
}
