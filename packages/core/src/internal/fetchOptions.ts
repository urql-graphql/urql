import {
  stringifyDocument,
  getOperationName,
  stringifyVariables,
  extractFiles,
} from '../utils';

import type { AnyVariables, GraphQLRequest, Operation } from '../types';

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
  Variables extends AnyVariables = AnyVariables,
>(request: Omit<GraphQLRequest<Data, Variables>, 'key'>): FetchBody {
  const isAPQ =
    request.extensions &&
    request.extensions.persistedQuery &&
    !request.extensions.persistedQuery.miss;
  return {
    query: isAPQ ? undefined : stringifyDocument(request.query),
    operationName: getOperationName(request.query),
    variables: request.variables || undefined,
    extensions: request.extensions,
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

  const urlParts = splitOutSearchParams(operation.context.url);
  for (const key in body) {
    const value = body[key];
    if (value) {
      urlParts[1].set(
        key,
        typeof value === 'object' ? stringifyVariables(value) : value
      );
    }
  }
  const finalUrl = urlParts.join('?');
  if (finalUrl.length > 2047 && useGETMethod !== 'force') {
    operation.context.preferGetMethod = false;
    return operation.context.url;
  }

  return finalUrl;
};

const splitOutSearchParams = (
  url: string
): readonly [string, URLSearchParams] => {
  const start = url.indexOf('?');
  return start > -1
    ? [url.slice(0, start), new URLSearchParams(url.slice(start + 1))]
    : [url, new URLSearchParams()];
};

/** Serializes a {@link FetchBody} into a {@link RequestInit.body} format. */
const serializeBody = (
  operation: Operation,
  body?: FetchBody
): FormData | string | undefined => {
  const omitBody =
    operation.kind === 'query' && !!operation.context.preferGetMethod;
  if (body && !omitBody) {
    const json = stringifyVariables(body);
    const files = extractFiles(body.variables);
    if (files.size) {
      const form = new FormData();
      form.append('operations', json);
      form.append(
        'map',
        stringifyVariables({
          ...[...files.keys()].map(value => [value]),
        })
      );
      let index = 0;
      for (const file of files.values()) form.append(`${index++}`, file);
      return form;
    }
    return json;
  }
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
  const headers: HeadersInit = {
    accept:
      operation.kind === 'subscription'
        ? 'text/event-stream, multipart/mixed'
        : 'application/graphql-response+json, application/graphql+json, application/json, text/event-stream, multipart/mixed',
  };
  const extraOptions =
    (typeof operation.context.fetchOptions === 'function'
      ? operation.context.fetchOptions()
      : operation.context.fetchOptions) || {};
  if (extraOptions.headers)
    for (const key in extraOptions.headers)
      headers[key.toLowerCase()] = extraOptions.headers[key];
  const serializedBody = serializeBody(operation, body);
  if (typeof serializedBody === 'string' && !headers['content-type'])
    headers['content-type'] = 'application/json';
  return {
    ...extraOptions,
    method: serializedBody ? 'POST' : 'GET',
    body: serializedBody,
    headers,
  };
};
