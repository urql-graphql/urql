import Observable from 'zen-observable-ts';

import { CombinedError } from '../lib';
import { IOperation } from './operation';

// Adapted from: https://github.com/graphql/graphql-js/blob/ae5b163d2e6c124107fa0971f6d838c8a7d29f51/src/execution/execute.js#L105-L114<Paste>
export interface IExecutionResult {
  errors?: Error[];
  data?: object;
}

export interface IExchangeResult {
  operation: IOperation; // Add on the original operation
  data: IExecutionResult['data'];
  error?: CombinedError;
}

export type IExchange = (operation: IOperation) => Observable<IExchangeResult>;
