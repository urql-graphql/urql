import type {
  ExecutionResult,
  Operation,
  OperationResult,
  IncrementalPayload,
} from '../types';
import { CombinedError } from './error';

/** Converts the `ExecutionResult` received for a given `Operation` to an `OperationResult`.
 *
 * @param operation - The {@link Operation} for which the API’s result is for.
 * @param result - The GraphQL API’s {@link ExecutionResult}.
 * @param response - Optionally, a raw object representing the API’s result (Typically a {@link Response}).
 * @returns An {@link OperationResult}.
 *
 * @remarks
 * This utility can be used to create {@link OperationResult | OperationResults} in the shape
 * that `urql` expects and defines, and should be used rather than creating the results manually.
 *
 * @throws
 * If no data, or errors are contained within the result, or the result is instead an incremental
 * response containing a `path` property, a “No Content” error is thrown.
 *
 * @see {@link ExecutionResult} for the type definition of GraphQL API results.
 */
export const makeResult = (
  operation: Operation,
  result: ExecutionResult,
  response?: any
): OperationResult => {
  if (
    !('data' in result) &&
    (!('errors' in result) || !Array.isArray(result.errors))
  ) {
    throw new Error('No Content');
  }

  const defaultHasNext = operation.kind === 'subscription';
  return {
    operation,
    data: result.data,
    error: Array.isArray(result.errors)
      ? new CombinedError({
          graphQLErrors: result.errors,
          response,
        })
      : undefined,
    extensions: result.extensions ? { ...result.extensions } : undefined,
    hasNext: result.hasNext == null ? defaultHasNext : result.hasNext,
    stale: false,
  };
};

const deepMerge = (target: any, source: any): any => {
  if (typeof target === 'object' && target != null) {
    if (
      !target.constructor ||
      target.constructor === Object ||
      Array.isArray(target)
    ) {
      target = Array.isArray(target) ? [...target] : { ...target };
      for (const key of Object.keys(source))
        target[key] = deepMerge(target[key], source[key]);
      return target;
    }
  }
  return source;
};

/** Merges an incrementally delivered `ExecutionResult` into a previous `OperationResult`.
 *
 * @param prevResult - The {@link OperationResult} that preceded this result.
 * @param path - The GraphQL API’s {@link ExecutionResult} that should be patching the `prevResult`.
 * @param response - Optionally, a raw object representing the API’s result (Typically a {@link Response}).
 * @returns A new {@link OperationResult} patched with the incremental result.
 *
 * @remarks
 * This utility should be used to merge subsequent {@link ExecutionResult | ExecutionResults} of
 * incremental responses into a prior {@link OperationResult}.
 *
 * When directives like `@defer`, `@stream`, and `@live` are used, GraphQL may deliver new
 * results that modify previous results. In these cases, it'll set a `path` property to modify
 * the result it sent last. This utility is built to handle these cases and merge these payloads
 * into existing {@link OperationResult | OperationResults}.
 *
 * @see {@link ExecutionResult} for the type definition of GraphQL API results.
 */
export const mergeResultPatch = (
  prevResult: OperationResult,
  nextResult: ExecutionResult,
  response?: any,
  pending?: ExecutionResult['pending']
): OperationResult => {
  let errors = prevResult.error ? prevResult.error.graphQLErrors : [];
  let hasExtensions =
    !!prevResult.extensions || !!(nextResult.payload || nextResult).extensions;
  const extensions = {
    ...prevResult.extensions,
    ...(nextResult.payload || nextResult).extensions,
  };

  let incremental = nextResult.incremental;

  // NOTE: We handle the old version of the incremental delivery payloads as well
  if ('path' in nextResult) {
    incremental = [nextResult as IncrementalPayload];
  }

  const withData = { data: prevResult.data };
  if (incremental) {
    for (const patch of incremental) {
      if (Array.isArray(patch.errors)) {
        errors.push(...(patch.errors as any));
      }

      if (patch.extensions) {
        Object.assign(extensions, patch.extensions);
        hasExtensions = true;
      }

      let prop: string | number = 'data';
      let part: Record<string, any> | Array<any> = withData;
      let path: readonly (string | number)[] = [];
      if (patch.path) {
        path = patch.path;
      } else if (pending) {
        const res = pending.find(pendingRes => pendingRes.id === patch.id);
        if (patch.subPath) {
          path = [...res!.path, ...patch.subPath];
        } else {
          path = res!.path;
        }
      }

      for (let i = 0, l = path.length; i < l; prop = path[i++]) {
        part = part[prop] = Array.isArray(part[prop])
          ? [...part[prop]]
          : { ...part[prop] };
      }

      if (patch.items) {
        const startIndex = +prop >= 0 ? (prop as number) : 0;
        for (let i = 0, l = patch.items.length; i < l; i++)
          part[startIndex + i] = deepMerge(
            part[startIndex + i],
            patch.items[i]
          );
      } else if (patch.data !== undefined) {
        part[prop] = deepMerge(part[prop], patch.data);
      }
    }
  } else {
    withData.data = (nextResult.payload || nextResult).data || prevResult.data;
    errors =
      (nextResult.errors as any[]) ||
      (nextResult.payload && nextResult.payload.errors) ||
      errors;
  }

  return {
    operation: prevResult.operation,
    data: withData.data,
    error: errors.length
      ? new CombinedError({ graphQLErrors: errors, response })
      : undefined,
    extensions: hasExtensions ? extensions : undefined,
    hasNext:
      nextResult.hasNext != null ? nextResult.hasNext : prevResult.hasNext,
    stale: false,
  };
};

/** Creates an `OperationResult` containing a network error for requests that encountered unexpected errors.
 *
 * @param operation - The {@link Operation} for which the API’s result is for.
 * @param error - The network-like error that prevented an API result from being delivered.
 * @param response - Optionally, a raw object representing the API’s result (Typically a {@link Response}).
 * @returns An {@link OperationResult} containing only a {@link CombinedError}.
 *
 * @remarks
 * This utility can be used to create {@link OperationResult | OperationResults} in the shape
 * that `urql` expects and defines, and should be used rather than creating the results manually.
 * This function should be used for when the {@link CombinedError.networkError} property is
 * populated and no GraphQL execution actually occurred.
 */
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
  hasNext: false,
  stale: false,
});
