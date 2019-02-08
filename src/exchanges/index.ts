export { cacheExchange } from './cache';
export { subscriptionExchange } from './subscription';
export { debugExchange } from './debug';
export { dedupeExchange } from './dedup';
export { fetchExchange } from './fetch';
export { composeExchanges } from './compose';

import { cacheExchange } from './cache';
import { dedupeExchange } from './dedup';
import { fetchExchange } from './fetch';

export const defaultExchanges = [dedupeExchange, cacheExchange, fetchExchange];
