import {
  Exchange,
  makeOperation,
  Operation,
  OperationContext,
} from '@urql/core';
import { fromPromise, fromValue, mergeMap, pipe } from 'wonka';

export interface ContextExchangeArgs {
  getContext: (
    operation: Operation
  ) => OperationContext | Promise<OperationContext>;
}

export const contextExchange = ({
  getContext,
}: ContextExchangeArgs): Exchange => ({ forward }) => {
  return ops$ => {
    return pipe(
      ops$,
      mergeMap(operation => {
        const result = getContext(operation);
        const isPromise = 'then' in result;
        if (isPromise) {
          return fromPromise(
            result.then((ctx: OperationContext) =>
              makeOperation(operation.kind, operation, ctx)
            )
          );
        } else {
          return fromValue(
            makeOperation(operation.kind, operation, result as OperationContext)
          );
        }
      }),
      forward
    );
  };
};
