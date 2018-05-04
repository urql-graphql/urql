import Observable from 'zen-observable-ts';

import { ExecutionResult } from 'graphql';
import { CombinedError } from '../modules/error';
import { IOperation } from './operation';

export interface IExchangeResult {
  data: ExecutionResult['data'];
  error?: CombinedError;
  typeNames?: string[];
}

export type IExchange = (operation: IOperation) => Observable<IExchangeResult>;
