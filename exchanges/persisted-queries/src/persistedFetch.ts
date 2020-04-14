/* eslint-disable @typescript-eslint/no-use-before-define */
import { Kind, DocumentNode, OperationDefinitionNode, print } from 'graphql';
import { filter, make, merge, mergeMap, pipe, share, takeUntil } from 'wonka';
import {
  Exchange,
  Operation,
  OperationResult,
  makeResult,
  makeErrorResult,
} from '@urql/core';

interface Body {
  query: string;
  variables: void | object;
  operationName?: string;
}

// @ts-ignore
(window as any).crypto = window.crypto || window.msCrypto; //for IE11
// @ts-ignore
if (window.crypto && window.crypto.webkitSubtle) {
  // @ts-ignore
  window.crypto.subtle = window.crypto.webkitSubtle; //for Safari
}

function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  const hash = window.crypto.subtle.digest({ name: 'SHA-256' }, bytes);
  return new Promise((resolve, reject) => {
    // IE11
    if (hash.oncomplete) {
      hash.oncomplete = function(e) {
        resolve(new Uint8Array(e.target.result));
      };
      hash.onerror = function(e) {
        reject(undefined, e);
      };
    }
    // standard promise-based
    else {
      hash
        .then(function(result) {
          resolve(new Uint8Array(result));
        })
        .catch(function(error) {
          reject(undefined, error);
        });
    }
  });
}

const hash = async (query: string) => {
  const msgUint8 = new TextEncoder().encode(query);
  return Array.from(await sha256(msgUint8))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// TODO: consider making this a HOC that allows for custom hash function.
export const fetchExchange: Exchange = ({ forward }) => {
  return ops$ => {
    const sharedOps$ = share(ops$);
    const fetchResults$ = pipe(
      sharedOps$,
      filter(operation => operation.operationName === 'query'),
      mergeMap(operation => {
        return pipe(
          createFetchSource(operation, !!operation.context.preferGetMethod),
          takeUntil(
            pipe(
              sharedOps$,
              filter(
                op =>
                  op.operationName === 'teardown' && op.key === operation.key
              )
            )
          )
        );
      })
    );

    const forward$ = pipe(
      sharedOps$,
      filter(operation => operation.operationName !== 'query'),
      forward
    );

    return merge([fetchResults$, forward$]);
  };
};

const getOperationName = (query: DocumentNode): string | null => {
  const node = query.definitions.find(
    (node: any): node is OperationDefinitionNode => {
      return node.kind === Kind.OPERATION_DEFINITION && node.name;
    }
  );

  return node ? node.name!.value : null;
};

const createFetchSource = (operation: Operation, shouldUseGet: boolean) => {
  if (
    process.env.NODE_ENV !== 'production' &&
    (operation.operationName === 'subscription' ||
      operation.operationName === 'mutation')
  ) {
    throw new Error(
      `Received a ${operation.operationName} operation in the persistedQueryExchange.`
    );
  }

  return make<OperationResult>(({ next, complete }) => {
    const abortController =
      typeof AbortController !== 'undefined'
        ? new AbortController()
        : undefined;

    const extraOptions =
      typeof operation.context.fetchOptions === 'function'
        ? operation.context.fetchOptions()
        : operation.context.fetchOptions || {};

    const operationName = getOperationName(operation.query);

    const body: Body = {
      query: await hash(print(operation.query)),
      variables: operation.variables,
    };

    if (operationName !== null) {
      body.operationName = operationName;
    }

    const fetchOptions = {
      ...extraOptions,
      body: shouldUseGet ? undefined : JSON.stringify(body),
      method: shouldUseGet ? 'GET' : 'POST',
      headers: {
        'content-type': 'application/json',
        ...extraOptions.headers,
      },
      signal:
        abortController !== undefined ? abortController.signal : undefined,
    };

    if (shouldUseGet) {
      operation.context.url = convertToGet(operation.context.url, body);
    }

    let ended = false;

    Promise.resolve()
      .then(() => (ended ? undefined : executeFetch(operation, fetchOptions)))
      .then((result: OperationResult | undefined) => {
        if (!ended) {
          ended = true;
          if (result) next(result);
          complete();
        }
      });

    return () => {
      ended = true;
      if (abortController !== undefined) {
        abortController.abort();
      }
    };
  });
};

const executeFetch = (
  operation: Operation,
  opts: RequestInit
): Promise<OperationResult> => {
  const { url, fetch: fetcher } = operation.context;
  let statusNotOk = false;
  let response: Response;

  return (fetcher || fetch)(url, opts)
    .then((res: Response) => {
      response = res;
      statusNotOk =
        res.status < 200 ||
        res.status >= (opts.redirect === 'manual' ? 400 : 300);
      return res.json();
    })
    .then((result: any) => {
      if (!('data' in result) && !('errors' in result)) {
        throw new Error('No Content');
      }

      return makeResult(operation, result, response);
    })
    .catch((error: Error) => {
      if (error.name !== 'AbortError') {
        return makeErrorResult(
          operation,
          statusNotOk ? new Error(response.statusText) : error,
          response
        );
      }
    });
};

export const convertToGet = (uri: string, body: Body): string => {
  const queryParams: string[] = [`query=${encodeURIComponent(body.query)}`];

  if (body.variables) {
    queryParams.push(
      `variables=${encodeURIComponent(JSON.stringify(body.variables))}`
    );
  }

  return uri + '?' + queryParams.join('&');
};
