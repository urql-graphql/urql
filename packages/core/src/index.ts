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
