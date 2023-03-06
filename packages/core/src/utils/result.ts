import { ExecutionResult, Operation, OperationResult } from '../types';
import { CombinedError, rehydrateGraphQlError } from './error';

export const makeResult = (
  operation: Operation,
  result: ExecutionResult,
  response?: any
): OperationResult => {
  if (
    (!('data' in result) && !('errors' in result)) ||
    'incremental' in result
  ) {
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
  nextResult: ExecutionResult,
  response?: any
): OperationResult => {
  let data: ExecutionResult['data'];
  let hasExtensions = !!prevResult.extensions || !!nextResult.extensions;
  const extensions = { ...prevResult.extensions, ...nextResult.extensions };
  const errors = prevResult.error ? prevResult.error.graphQLErrors : [];

  if (nextResult.incremental) {
    data = { ...prevResult.data };
    for (const patch of nextResult.incremental) {
      if (Array.isArray(patch.errors)) {
        errors.push(...patch.errors.map(rehydrateGraphQlError));
      }

      if (patch.extensions) {
        Object.assign(extensions, patch.extensions);
        hasExtensions = true;
      }

      let prop: string | number = patch.path[0];
      let part: Record<string, any> | Array<any> = data as object;
      for (let i = 1, l = patch.path.length; i < l; prop = patch.path[i++]) {
        part = part[prop] = Array.isArray(part[prop])
          ? [...part[prop]]
          : { ...part[prop] };
      }

      if (Array.isArray(patch.items)) {
        const startIndex = typeof prop == 'number' && prop >= 0 ? prop : 0;
        for (let i = 0, l = patch.items.length; i < l; i++)
          part[startIndex + i] = patch.items[i];
      } else if (patch.data !== undefined) {
        part[prop] =
          part[prop] && patch.data
            ? { ...part[prop], ...patch.data }
            : patch.data;
      }
    }
  } else {
    data = nextResult.data || prevResult.data;
  }

  return {
    operation: prevResult.operation,
    data,
    error: errors.length
      ? new CombinedError({ graphQLErrors: errors, response })
      : undefined,
    extensions: hasExtensions ? extensions : undefined,
    hasNext: !!nextResult.hasNext,
  };
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
