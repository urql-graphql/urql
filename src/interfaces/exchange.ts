import Observable from 'zen-observable-ts';

import { ExecutionResult } from 'graphql';
import { IOperation } from './operation';
import { CombinedError } from '../modules/error';

export interface IExchangeResult {
  data: ExecutionResult['data'];
  error?: CombinedError;
  typeNames?: string[];
}

export type IExchange = (operation: IOperation) => Observable<IExchangeResult>;
