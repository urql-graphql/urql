import {
  Exchange,
  makeOperation,
  Operation,
  OperationContext,
} from '@urql/core';

import { fromPromise, fromValue, mergeMap, pipe } from 'wonka';

/** Input parameters for the {@link contextExchange}. */
export interface ContextExchangeArgs {
  /** Returns a new {@link OperationContext}, optionally wrapped in a `Promise`.
   *
   * @remarks
   * `getContext` is called for every {@link Operation} the `contextExchange`
   * receives and must return a new {@link OperationContext} or a `Promise`
   * of it.
   *
   * The new `OperationContext` will be used to update the `Operation`'s
   * context before it's forwarded to the next exchange.
   */
  getContext(
    operation: Operation
  ): OperationContext | Promise<OperationContext>;
}

/** Exchange factory modifying the {@link OperationContext} per incoming `Operation`.
 *
 * @param options - A {@link ContextExchangeArgs} configuration object.
 * @returns the created context {@link Exchange}.
 *
 * @remarks
 * The `contextExchange` allows the {@link OperationContext` to be easily
 * modified per `Operation`. This may be useful to dynamically change the
 * `Operation`’s parameters, even when we need to do so asynchronously.
 *
 * You must define a {@link ContextExchangeArgs.getContext} function,
 * which may return a `Promise<OperationContext>` or `OperationContext`.
 *
 * Hint: If the `getContext` function passed to this exchange returns a
 * `Promise` it must be placed _after_ all synchronous exchanges, such as
 * a `cacheExchange`.
 *
 * @example
 * ```ts
 * import { Client, cacheExchange, fetchExchange } from '@urql/core';
 * import { contextExchange } from '@urql/exchange-context';
 *
 * const client = new Client({
 *   url: '',
 *   exchanges: [
 *     cacheExchange,
 *     contextExchange({
 *       async getContext(operation) {
 *         const url = await loadDynamicUrl();
 *         return {
 *           ...operation.context,
 *           url,
 *         };
 *       },
 *     }),
 *     fetchExchange,
 *   ],
 * });
 * ```
 */

export const contextExchange =
  ({ getContext }: ContextExchangeArgs): Exchange =>
  ({ forward }) => {
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
              makeOperation(
                operation.kind,
                operation,
                result as OperationContext
              )
            );
          }
        }),
        forward
      );
    };
  };
