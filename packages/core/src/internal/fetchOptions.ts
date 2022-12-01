import {
  stringifyDocument,
  getOperationName,
  stringifyVariables,
} from '../utils';
import { AnyVariables, GraphQLRequest, Operation } from '../types';

export interface FetchBody {
  query?: string;
  operationName: string | undefined;
  variables: undefined | Record<string, any>;
  extensions: undefined | Record<string, any>;
}

export function makeFetchBody<
  Data = any,
  Variables extends AnyVariables = AnyVariables
>(request: Omit<GraphQLRequest<Data, Variables>, 'key'>): FetchBody {
  return {
    query: stringifyDocument(request.query),
    operationName: getOperationName(request.query),
    variables: request.variables || undefined,
    extensions: undefined,
  };
}

export const makeFetchURL = (
  operation: Operation,
  body?: FetchBody
): string => {
  const useGETMethod =
    operation.kind === 'query' && operation.context.preferGetMethod;
  if (!useGETMethod || !body) return operation.context.url;

  const url = new URL(operation.context.url);
  const search = url.searchParams;
  if (body.operationName) search.set('operationName', body.operationName);
  if (body.query) search.set('query', body.query);
  if (body.variables)
    search.set('variables', stringifyVariables(body.variables));
  if (body.extensions)
    search.set('extensions', stringifyVariables(body.extensions));

  const finalUrl = url.toString();
  if (finalUrl.length > 2047 && useGETMethod !== 'force') {
    operation.context.preferGetMethod = false;
    return operation.context.url;
  }

  return finalUrl;
};

export const makeFetchOptions = (
  operation: Operation,
  body?: FetchBody
): RequestInit => {
  const useGETMethod =
    operation.kind === 'query' && !!operation.context.preferGetMethod;
  const headers: HeadersInit = {
    accept: 'application/graphql+json, application/json',
  };
  if (!useGETMethod) headers['content-type'] = 'application/json';
  const extraOptions =
    (typeof operation.context.fetchOptions === 'function'
      ? operation.context.fetchOptions()
      : operation.context.fetchOptions) || {};
  if (extraOptions.headers)
    for (const key in extraOptions.headers)
      headers[key.toLowerCase()] = extraOptions.headers[key];
  return {
    ...extraOptions,
    body: !useGETMethod && body ? JSON.stringify(body) : undefined,
    method: useGETMethod ? 'GET' : 'POST',
    headers,
  };
};
