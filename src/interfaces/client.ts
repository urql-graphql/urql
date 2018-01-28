import { IQueryResponse } from './../modules/client';
import { IMutation } from './mutation';
import { IQuery } from './query';

export interface IClient {
  executeQuery(
    queryObject: IQuery,
    skipCache: boolean
  ): Promise<IQueryResponse>;
  executeMutation(mutationObject: IMutation): Promise<object[]>;
  subscribe(
    callback: (changedTypes: string[], reponse: object) => void
  ): string;
  unsubscribe(id: string): void;
}
