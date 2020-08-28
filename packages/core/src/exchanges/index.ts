export { ssrExchange } from './ssr';
export { cacheExchange } from './cache';
export { subscriptionExchange } from './subscription';
export { debugExchange } from './debug';
export { dedupExchange } from './dedup';
export { fetchExchange } from './fetch';
export { fallbackExchangeIO } from './fallback';
export { composeExchanges } from './compose';
export { errorExchange } from './error';

import { cacheExchange } from './cache';
import { dedupExchange } from './dedup';
import { fetchExchange } from './fetch';

export const defaultExchanges = [dedupExchange, cacheExchange, fetchExchange];
