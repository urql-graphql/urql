import { Kind, print, DocumentNode } from 'graphql';

import { stringifyVariables } from '../utils';
import { Operation } from '../types';

export interface FetchBody {
  query: string;
  operationName: string | undefined;
  variables: string | undefined;
  extensions: undefined | Record<string, any>;
}

const getOperationName = (query: DocumentNode): string | undefined => {
  for (let i = 0, l = query.definitions.length; i < l; i++) {
    const node = query.definitions[i];
    if (node.kind === Kind.OPERATION_DEFINITION && node.name) {
      return node.name.value;
    }
  }
};

const shouldUseGet = (operation: Operation): boolean => {
  return (
    operation.operationName === 'query' && !!operation.context.preferGetMethod
  );
};

export const makeBody = (operation: Operation): FetchBody => ({
  query: print(operation.query),
  operationName: getOperationName(operation.query),
  variables: operation.variables
    ? stringifyVariables(operation.variables)
    : undefined,
  extensions: undefined,
});

export const makeURL = (operation: Operation, body: FetchBody): string => {
  const useGETMethod = shouldUseGet(operation);
  let url = operation.context.url;
  if (!useGETMethod) return url;

  url += `?query=${encodeURIComponent(body.query)}`;

  if (body.variables) url += `&variables=${encodeURIComponent(body.variables)}`;
  if (body.extensions)
    url += `&extensions=${encodeURIComponent(
      stringifyVariables(body.extensions)
    )}`;

  return url;
};

export const makeFetchOptions = (operation: Operation, body: FetchBody) => {
  const useGETMethod = shouldUseGet(operation);

  const extraOptions =
    typeof operation.context.fetchOptions === 'function'
      ? operation.context.fetchOptions()
      : operation.context.fetchOptions || {};

  return {
    ...extraOptions,
    body: useGETMethod ? undefined : JSON.stringify(body),
    method: useGETMethod ? 'GET' : 'POST',
    headers: {
      'content-type': 'application/json',
      ...extraOptions.headers,
    },
  };
};
