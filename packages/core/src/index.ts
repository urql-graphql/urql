export { gql } from './gql';

export * from './client';
export * from './exchanges';
export * from './types';

export {
  CombinedError,
  stringifyVariables,
  createRequest,
  makeResult,
  makeErrorResult,
  mergeResultPatch,
  formatDocument,
  maskTypename,
  makeOperation,
} from './utils';
