import Observable from 'zen-observable-ts';

import { ExecutionResult } from 'graphql';
import { IOperation } from './operation';

export type IExchange = (operation: IOperation) => Observable<ExecutionResult>;
