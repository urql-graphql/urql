import { Operation, OperationResult } from '../types';
import { CombinedError } from './error';

export const makeResult = (
  operation: Operation,
  result: any,
  response?: any
): OperationResult => ({
  operation,
  data: result.data,
  error: Array.isArray(result.errors)
    ? new CombinedError({
        graphQLErrors: result.errors,
        response,
      })
    : undefined,
  extensions:
    typeof result.extensions === 'object' && result.extensions !== null
      ? result.extensions
      : undefined,
});

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
