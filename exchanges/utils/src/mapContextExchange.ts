import { Exchange, Operation, OperationContext } from '@urql/core';
import { pipe, mergeMap, map, fromPromise, fromValue } from 'wonka';

export const mapContextExchange = (
  fn: (
    operationContext: OperationContext
  ) => Promise<OperationContext> | OperationContext
): Exchange => ({ forward }) => ops$ => {
  return pipe(
    ops$,
    mergeMap((operation: Operation) => {
      if (typeof operation.context.fetchOptions === 'function') {
        operation.context.fetchOptions = operation.context.fetchOptions();
      }

      const result = fn(operation.context);

      return pipe(
        typeof (result as any).then === 'function'
          ? fromPromise(result as Promise<OperationContext>)
          : fromValue(result as OperationContext),

        map((context: OperationContext) => ({
          ...operation,
          context: {
            ...operation.context,
            context,
            fetchOptions: {
              ...operation.context.fetchOptions,
              ...(typeof context.fetchOptions === 'function'
                ? context.fetchOptions()
                : context.fetchOptions),
            },
          },
        }))
      );
    }),
    forward
  );
};
