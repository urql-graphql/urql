export { gql } from './gql';

export * from './client';
export * from './exchanges';
export * from './types';

export {
  CombinedError,
  stringifyVariables,
  stringifyDocument,
  createRequest,
  makeResult,
  makeErrorResult,
  mergeResultPatch,
  formatDocument,
  makeOperation,
  getOperationName,
} from './utils';

export {
  maskFragment,
  getFragments,
  makeDeferredState,
  resolveDeferredState,
  isDeferredPromise,
  updateDeferredResult,
  makeCache,
  getDeferredCacheForClient,
} from './utils';

export type {
  FragmentMap,
  MaskFragmentResult,
  DeferredState,
  DeferredPromise,
  Cache,
} from './utils';
