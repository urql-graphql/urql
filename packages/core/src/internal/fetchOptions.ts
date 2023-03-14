import {
  stringifyDocument,
  getOperationName,
  stringifyVariables,
} from '../utils';
import { AnyVariables, GraphQLRequest, Operation } from '../types';

/** Abstract definition of the JSON data sent during GraphQL HTTP POST requests. */
export interface FetchBody {
  query?: string;
  operationName: string | undefined;
  variables: undefined | Record<string, any>;
  extensions: undefined | Record<string, any>;
}

/** Creates a GraphQL over HTTP compliant JSON request body.
 * @param request - An object containing a `query` document and `variables`.
 * @returns A {@link FetchBody}
 * @see {@link https://github.com/graphql/graphql-over-http} for the GraphQL over HTTP spec.
 */
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

/** Creates a URL that will be called for a GraphQL HTTP request.
 *
 * @param operation - An {@link Operation} for which to make the request.
 * @param body - A {@link FetchBody} which may be replaced with a URL.
 *
 * @remarks
 * Creates the URL that’ll be called as part of a GraphQL HTTP request.
 * Built-in fetch exchanges support sending GET requests, even for
 * non-persisted full requests, which this function supports by being
 * able to serialize GraphQL requests into the URL.
 */
export const makeFetchURL = (
  operation: Operation,
  body?: FetchBody
): string => {
  const useGETMethod =
    operation.kind === 'query' && operation.context.preferGetMethod;
  if (!useGETMethod || !body) return operation.context.url;

  const url = new URL(operation.context.url);
  for (const key in body) {
    const value = body[key];
    if (value) {
      url.searchParams.set(
        key,
        typeof value === 'object' ? stringifyVariables(value) : value
      );
    }
  }

  const finalUrl = url.toString();
  if (finalUrl.length > 2047 && useGETMethod !== 'force') {
    operation.context.preferGetMethod = false;
    return operation.context.url;
  }

  return finalUrl;
};

/** Creates a `RequestInit` object for a given `Operation`.
 *
 * @param operation - An {@link Operation} for which to make the request.
 * @param body - A {@link FetchBody} which is added to the options, if the request isn’t a GET request.
 *
 * @remarks
 * Creates the fetch options {@link RequestInit} object that’ll be passed to the Fetch API
 * as part of a GraphQL over HTTP request. It automatically sets a default `Content-Type`
 * header.
 *
 * @see {@link https://github.com/graphql/graphql-over-http} for the GraphQL over HTTP spec.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API} for the Fetch API spec.
 */
export const makeFetchOptions = (
  operation: Operation,
  body?: FetchBody
): RequestInit => {
  const useGETMethod =
    operation.kind === 'query' && !!operation.context.preferGetMethod;

  const hasStreamingDirective =
    body?.query?.includes('@defer') || body?.query?.includes('@stream');

  const headers: HeadersInit = {
    accept: `${
      hasStreamingDirective ? 'multipart/mixed, ' : ''
    }application/graphql-response+json, application/graphql+json, application/json`,
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
