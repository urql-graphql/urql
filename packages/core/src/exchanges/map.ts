import { mergeMap, fromValue, fromPromise, pipe } from 'wonka';
import { Operation, OperationResult, Exchange } from '../types';
import { CombinedError } from '../utils';

/** Options for the `mapExchange` allowing it to react to incoming operations, results, or errors. */
export interface MapExchangeOpts {
  /** Accepts a callback for incoming `Operation`s.
   *
   * @param operation - An {@link Operation} that the {@link mapExchange} received.
   * @returns optionally a new {@link Operation} replacing the original.
   *
   * @remarks
   * You may return new {@link Operation | Operations} from this function replacing
   * the original that the {@link mapExchange} received.
   * It’s recommended that you use the {@link makeOperation} utility to create a copy
   * of the original when you do this. (However, this isn’t required)
   *
   * Hint: The callback may also be promisified and return a new {@link Operation} asynchronously,
   * provided you place your {@link mapExchange} after all synchronous {@link Exchange | Exchanges},
   * like after your `cacheExchange`.
   */
  onOperation?(operation: Operation): Promise<Operation> | Operation | void;
  /** Accepts a callback for incoming `OperationResult`s.
   *
   * @param result - An {@link OperationResult} that the {@link mapExchange} received.
   * @returns optionally a new {@link OperationResult} replacing the original.
   *
   * @remarks
   * This callback may optionally return a new {@link OperationResult} that replaces the original,
   * which you can use to modify incoming API results.
   *
   * Hint: The callback may also be promisified and return a new {@link Operation} asynchronously,
   * provided you place your {@link mapExchange} after all synchronous {@link Exchange | Exchanges},
   * like after your `cacheExchange`.
   */
  onResult?(
    result: OperationResult
  ): Promise<OperationResult> | OperationResult | void;
  /** Accepts a callback for incoming `CombinedError`s.
   *
   * @param error - A {@link CombinedError} that an incoming {@link OperationResult} contained.
   * @param operation - The {@link Operation} of the incoming {@link OperationResult}.
   *
   * @remarks
   * The callback may also be promisified and return a new {@link Operation} asynchronously,
   * provided you place your {@link mapExchange} after all synchronous {@link Exchange | Exchanges},
   * like after your `cacheExchange`.
   */
  onError?(error: CombinedError, operation: Operation): void;
}

/** Creates an `Exchange` mapping over incoming operations, results, and/or errors.
 *
 * @param opts - A {@link MapExchangeOpts} configuration object, containing the callbacks the `mapExchange` will use.
 * @returns the created {@link Exchange}
 *
 * @remarks
 * The `mapExchange` may be used to react to or modify incoming {@link Operation | Operations}
 * and {@link OperationResult | OperationResults}. Optionally, it can also modify these
 * asynchronously, when a promise is returned from the callbacks.
 *
 * This is useful to, for instance, add an authentication token to a given request, when
 * the `@urql/exchange-auth` package would be overkill.
 *
 * It can also accept an `onError` callback, which can be used to react to incoming
 * {@link CombinedError | CombinedErrors} on results, and trigger side-effects.
 *
 */
export const mapExchange = ({
  onOperation,
  onResult,
  onError,
}: MapExchangeOpts): Exchange => {
  return ({ forward }) => ops$ => {
    return pipe(
      pipe(
        ops$,
        mergeMap(operation => {
          const newOperation =
            (onOperation && onOperation(operation)) || operation;
          return 'then' in newOperation
            ? fromPromise(newOperation)
            : fromValue(newOperation);
        })
      ),
      forward,
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
