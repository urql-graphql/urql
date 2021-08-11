import { DocumentNode, print } from 'graphql';

import { getOperationName, stringifyVariables } from '../utils';
import { Operation } from '../types';

export interface FetchBody {
  query?: string;
  operationName: string | undefined;
  variables: undefined | Record<string, any>;
  extensions: undefined | Record<string, any>;
}

const shouldUseGet = (operation: Operation): boolean => {
  return operation.kind === 'query' && !!operation.context.preferGetMethod;
};

export const makeFetchBody = (request: {
  query: DocumentNode;
  variables?: object;
}): FetchBody => ({
  query: print(request.query),
  operationName: getOperationName(request.query),
  variables: request.variables || undefined,
  extensions: undefined,
});

export const makeFetchURL = (
  operation: Operation,
  body?: FetchBody
): string => {
  const useGETMethod = shouldUseGet(operation);
  const url = operation.context.url;
  if (!useGETMethod || !body) return url;

  const search: string[] = [];
  if (body.operationName) {
    search.push('operationName=' + encodeURIComponent(body.operationName));
  }

  if (body.query) {
    search.push(
      'query=' +
        encodeURIComponent(body.query.replace(/#[^\n\r]+/g, ' ').trim())
    );
  }

  if (body.variables) {
    search.push(
      'variables=' + encodeURIComponent(stringifyVariables(body.variables))
    );
  }

  if (body.extensions) {
    search.push(
      'extensions=' + encodeURIComponent(stringifyVariables(body.extensions))
    );
  }

  return `${url}?${search.join('&')}`;
};

export const makeFetchOptions = (
  operation: Operation,
  body?: FetchBody
): RequestInit => {
  const useGETMethod = shouldUseGet(operation);

  const extraOptions =
    typeof operation.context.fetchOptions === 'function'
      ? operation.context.fetchOptions()
      : operation.context.fetchOptions || {};

  return {
    ...extraOptions,
    body: !useGETMethod && body ? JSON.stringify(body) : undefined,
    method: useGETMethod ? 'GET' : 'POST',
    headers: useGETMethod
      ? extraOptions.headers
      : { 'content-type': 'application/json', ...extraOptions.headers },
  };
};
