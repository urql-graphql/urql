import { mergeMap, fromValue, fromPromise, pipe } from 'wonka';
import { Operation, OperationResult, Exchange } from '../types';
import { CombinedError } from '../utils';

export interface MapExchangeOpts {
  onOperation?(operation: Operation): Promise<Operation> | Operation | void;
  onResult?(
    result: OperationResult
  ): Promise<OperationResult> | OperationResult | void;
  onError?(error: CombinedError, operation: Operation): void;
}

export const mapExchange = ({
  onOperation,
  onResult,
  onError,
}: MapExchangeOpts): Exchange => {
  return ({ forward }) => ops$ => {
    if (onOperation) {
      ops$ = pipe(
        ops$,
        mergeMap(operation => {
          const newOperation = onOperation(operation) || operation;
          return 'then' in newOperation
            ? fromPromise(newOperation)
            : fromValue(newOperation);
        })
      );
    }

    return pipe(
      forward(ops$),
      mergeMap(result => {
        if (onError && result.error) onError(result.error, result.operation);
        const newResult = (onResult && onResult(result)) || result;
        return 'then' in newResult
          ? fromPromise(newResult)
          : fromValue(newResult);
      })
    );
  };
};
