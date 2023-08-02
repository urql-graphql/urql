import type { Exchange } from '../types';

/** Default deduplication exchange.
 * @deprecated
 * This exchange's functionality is now built into the {@link Client}.
 */
export const dedupExchange: Exchange =
  ({ forward }) =>
  ops$ =>
    forward(ops$);
