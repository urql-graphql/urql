import { ExecutionResult, Operation, OperationResult } from '../types';
import { CombinedError } from './error';

export const makeResult = (
  operation: Operation,
  result: any,
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
  };
};

export const mergeResultPatch = (
  prevResult: OperationResult,
  patch: ExecutionResult,
  response?: any
): OperationResult => {
  const result = { ...prevResult };
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

  let part: Record<string, any> | Array<any> = (prevResult.data = {
    ...prevResult.data,
  });
  const i = 0;

  for (let i = 0, l = patch.path.length - 1; i < l; i++) {
    const prop = patch.path[i];
    part = part[prop] = Array.isArray(part[prop])
      ? [...part[prop]]
      : { ...part[prop] };
  }

  part[patch.path[i]] = patch.data;
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
