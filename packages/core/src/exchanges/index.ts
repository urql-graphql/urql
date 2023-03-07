export { ssrExchange } from './ssr';
export { cacheExchange } from './cache';
export { subscriptionExchange } from './subscription';
export { debugExchange } from './debug';
export { dedupExchange } from './dedup';
export { fetchExchange } from './fetch';
export { composeExchanges } from './compose';

export type {
  SubscriptionOperation,
  SubscriptionForwarder,
  SubscriptionExchangeOpts,
} from './subscription';

export { mapExchange, mapExchange as errorExchange } from './map';
export type { MapExchangeOpts } from './map';

import { cacheExchange } from './cache';
import { dedupExchange } from './dedup';
import { fetchExchange } from './fetch';

/** The default list of exchanges a `Client` falls back to.
 *
 * @remarks
 * When {@link ClientOptions.exchanges} isn’s passed, a {@link Client} is automatically
 * created using this list of default exchanges.
 *
 * By default, this adds deduplication of operations, a basic document cache,
 * and the built-in fetch exchange for GraphQL over HTTP.
 */
export const defaultExchanges = [dedupExchange, cacheExchange, fetchExchange];
