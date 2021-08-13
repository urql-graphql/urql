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
  let original;
  while (i < patch.path.length - 1) {
    const prop = patch.path[i++];
    original = original ? original[prop] : result.data[prop];
    part = part[prop] = Array.isArray(part[prop])
      ? [...part[prop]]
      : { ...original, ...part[prop] };
  }

  if (
    typeof part[patch.path[i]] === 'object' &&
    !Array.isArray(part[patch.path[i]])
  ) {
    part[patch.path[i]] = {
      ...(original ? original : result.data)[patch.path[i]],
      ...patch.data,
    };
  } else {
    part[patch.path[i]] = patch.data;
  }

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
