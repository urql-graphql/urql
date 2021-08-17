import { ExecutionResult, Operation, OperationResult } from '../types';
import { CombinedError } from './error';

export const makeResult = (
  operation: Operation,
  result: ExecutionResult,
  response?: any
): OperationResult => {
  if ((!('data' in result) && !('errors' in result)) || 'path' in result) {
    throw new Error('No Content');
  }

  return {
    operation,
    data: result.data,
    error: Array.isArray(result.errors)
      ? new CombinedError({
          graphQLErrors: result.errors,
          response,
        })
      : undefined,
    extensions:
      (typeof result.extensions === 'object' && result.extensions) || undefined,
    hasNext: !!result.hasNext,
  };
};

export const mergeResultPatch = (
  prevResult: OperationResult,
  patch: ExecutionResult,
  response?: any
): OperationResult => {
  const result = { ...prevResult };
  result.hasNext = !!patch.hasNext;

  if (!('path' in patch)) {
    if ('data' in patch) result.data = patch.data;
    return result;
  }

  if (Array.isArray(patch.errors)) {
    result.error = new CombinedError({
      graphQLErrors: result.error
        ? [...result.error.graphQLErrors, ...patch.errors]
        : patch.errors,
      response,
    });
  }

  let part: Record<string, any> | Array<any> = (result.data = {
    ...result.data,
  });

  let i = 0;
  let prop: string | number;
  while (i < patch.path.length) {
    prop = patch.path[i++];
    part = part[prop] = Array.isArray(part[prop])
      ? [...part[prop]]
      : { ...part[prop] };
  }

  Object.assign(part, patch.data);
  return result;
};

export const makeErrorResult = (
  operation: Operation,
  error: Error,
  response?: any
): OperationResult => ({
  operation,
  data: undefined,
  error: new CombinedError({
    networkError: error,
    response,
  }),
  extensions: undefined,
});
