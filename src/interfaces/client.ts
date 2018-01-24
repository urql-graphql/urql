import { QueryResponse } from './../modules/client';
import { Query } from './query';
import { Mutation } from './mutation';

export interface Client {
  executeQuery(queryObject: Query, skipCache: Boolean): Promise<QueryResponse>;
  executeMutation(mutationObject: Mutation): Promise<Array<object>>;
  subscribe(
    callback: (changedTypes: Array<string>, reponse: object) => void
  ): string;
  unsubscribe(id: string): void;
}
