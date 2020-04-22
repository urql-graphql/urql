/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  Source,
  fromValue,
  filter,
  merge,
  mergeMap,
  pipe,
  share,
  takeUntil,
} from 'wonka';
import {
  CombinedError,
  Exchange,
  Operation,
  OperationResult,
} from '@urql/core';

import {
  makeFetchBody,
  makeFetchURL,
  makeFetchOptions,
  makeFetchSource,
} from '@urql/core/internal';

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
      hash.oncomplete = function (e) {
        resolve(new Uint8Array(e.target.result));
      };
      hash.onerror = function (e) {
        reject(undefined, e);
      };
    }
    // standard promise-based
    else {
      hash
        .then(function (result) {
          resolve(new Uint8Array(result));
        })
        .catch(function (error) {
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

export const fetchExchange: Exchange = ({ forward }) => {
  let supportsPersistedQueries = true;

  return ops$ => {
    const sharedOps$ = share(ops$);
    const fetchResults$ = pipe(
      sharedOps$,
      filter(operation => operation.operationName === 'query'),
      mergeMap(operation => {
        const { key } = operation;
        const teardown$ = pipe(
          sharedOps$,
          filter(op => op.operationName === 'teardown' && op.key === key)
        );

        if (!supportsPersistedQueries || operation.operationName !== 'query') {
          return pipe(makeNormalFetchSource(operation), takeUntil(teardown$));
        }

        return pipe(
          makePersistedFetchSource(operation),
          mergeMap(result => {
            if (result.error && isPersistedUnsupported(result.error)) {
              supportsPersistedQueries = false;
              return makeNormalFetchSource(operation);
            } else if (result.error && isPersistedMiss(result.error)) {
              return makeNormalFetchSource(operation);
            }

            return fromValue(result);
          }),
          takeUntil(teardown$)
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

const makePersistedFetchSource = (
  operation: Operation
): Source<OperationResult> => {
  const body = makeFetchBody(operation);
  const query: string = body.query!;

  body.query = undefined;
  body.extensions = {
    persistedQuery: {
      version: 1,
      sha256hash: hash(query),
    },
  };

  return makeFetchSource(
    operation,
    makeFetchURL(operation, body),
    makeFetchOptions(operation, body)
  );
};

const makeNormalFetchSource = (
  operation: Operation
): Source<OperationResult> => {
  const body = makeFetchBody(operation);

  return makeFetchSource(
    operation,
    makeFetchURL(operation, body),
    makeFetchOptions(operation, body)
  );
};

const isPersistedMiss = (error: CombinedError): boolean =>
  error.graphQLErrors.some(x => x.message === 'PersistedQueryNotFound');

const isPersistedUnsupported = (error: CombinedError): boolean =>
  error.graphQLErrors.some(x => x.message === 'PersistedQueryNotFound');
