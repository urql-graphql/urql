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
        const isPromise = 'then' in getContext;
        if (isPromise) {
          return fromPromise(
            getContext(operation).then((ctx: OperationContext) =>
              makeOperation(operation.kind, operation, ctx)
            )
          );
        } else {
          return fromValue(
            makeOperation(
              operation.kind,
              operation,
              getContext(operation) as OperationContext
            )
          );
        }
      }),
      forward
    );
  };
};
