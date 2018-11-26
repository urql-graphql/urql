import Observable from 'zen-observable-ts';

import { CombinedError } from '../lib';
import { Operation } from './operation';

// Adapted from: https://github.com/graphql/graphql-js/blob/ae5b163d2e6c124107fa0971f6d838c8a7d29f51/src/execution/execute.js#L105-L114<Paste>
export interface ExecutionResult {
  errors?: Error[];
  data?: object;
}

export interface ExchangeResult {
  operation: Operation; // Add on the original operation
  data: ExecutionResult['data'];
  error?: CombinedError;
}

export type Exchange = (operation: Operation) => Observable<ExchangeResult>;
