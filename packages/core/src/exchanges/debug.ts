import { pipe, tap } from 'wonka';
import type { Exchange } from '../types';

/** Simple log debugger exchange.
 *
 * @remarks
 * An exchange that logs incoming {@link Operation | Operations} and
 * {@link OperationResult | OperationResults} in development.
 *
 * This exchange is a no-op in production and often used in issue reporting
 * to understand certain usage patterns of `urql` without having access to
 * the original source code.
 *
 * Hint: When you report an issue you’re having with `urql`, adding
 * this as your first exchange and posting its output can speed up
 * issue triaging a lot!
 */
export const debugExchange: Exchange = ({ forward }) => {
  if (process.env.NODE_ENV === 'production') {
    return ops$ => forward(ops$);
  } else {
    return ops$ =>
      pipe(
        ops$,
        // eslint-disable-next-line no-console
        tap(op => console.log('[Exchange debug]: Incoming operation: ', op)),
        forward,
        tap(result =>
          // eslint-disable-next-line no-console
          console.log('[Exchange debug]: Completed operation: ', result)
        )
      );
  }
};
