/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  Source,
  fromValue,
  fromPromise,
  filter,
  merge,
  mergeMap,
  pipe,
  share,
  onPush,
  takeUntil,
} from 'wonka';

import {
  CombinedError,
  ExchangeInput,
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

import { hash } from './sha256';

export const persistedFetchExchange: Exchange = ({ forward, dispatchDebug }) => {
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

        if (!supportsPersistedQueries) {
          return pipe(makeNormalFetchSource(operation, dispatchDebug), takeUntil(teardown$));
        }

        return pipe(
          makePersistedFetchSource(operation, dispatchDebug),
          mergeMap(result => {
            if (result.error && isPersistedUnsupported(result.error)) {
              supportsPersistedQueries = false;
              return makeNormalFetchSource(operation, dispatchDebug);
            } else if (result.error && isPersistedMiss(result.error)) {
              return makeNormalFetchSource(operation, dispatchDebug);
            }

            return fromValue(result);
          }),
          takeUntil(teardown$),
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
  operation: Operation,
  dispatchDebug: ExchangeInput["dispatchDebug"]
): Source<OperationResult> => {
  const body = makeFetchBody(operation);
  const query: string = body.query!;

  return pipe(
    fromPromise(hash(query)),
    mergeMap(sha256Hash => {
      body.query = undefined;
      body.extensions = {
        persistedQuery: {
          version: 1,
          sha256Hash,
        },
      };

      const url = makeFetchURL(operation, { ...body, query: '' });
      const fetchOptions = makeFetchOptions(operation, body);

      dispatchDebug({
        type: 'fetchRequest',
        message: 'A fetch request for a persisted query is being executed.',
        operation,
        data: {
          url,
          fetchOptions,
        },
      });

      return pipe(
        makeFetchSource(operation, url, fetchOptions),
        onPush(result => {
          const persistFail = result.error
            && (isPersistedMiss(result.error) || isPersistedUnsupported(result.error));
          const error = !result.data ? result.error : undefined;

          dispatchDebug({
            type: persistFail ? 'persistedFetchError' : (error ? 'fetchError' : 'fetchSuccess'),
            message: persistFail
              ? 'A Persisted Query request has failed. A normal GraphQL request will follow.'
              : `A ${error ? 'failed' : 'successful'} fetch response has been returned.`,
            operation,
            data: {
              url,
              fetchOptions,
              value: error || result,
            },
          });
        })
      );
    })
  );
};

const makeNormalFetchSource = (
  operation: Operation,
  dispatchDebug: ExchangeInput["dispatchDebug"]
): Source<OperationResult> => {
  const body = makeFetchBody(operation);
  const url = makeFetchURL(operation, body);
  const fetchOptions = makeFetchOptions(operation, body);

  dispatchDebug({
    type: 'fetchRequest',
    message: 'A fetch request is being executed.',
    operation,
    data: {
      url,
      fetchOptions,
    },
  });

  return pipe(
    makeFetchSource(operation, url, fetchOptions),
    onPush(result => {
      const error = !result.data ? result.error : undefined;

      dispatchDebug({
        type: error ? 'fetchError' : 'fetchSuccess',
        message: `A ${
          error ? 'failed' : 'successful'
        } fetch response has been returned.`,
        operation,
        data: {
          url,
          fetchOptions,
          value: error || result,
        },
      });
    })
  );
};

const isPersistedMiss = (error: CombinedError): boolean =>
  error.graphQLErrors.some(x => x.message === 'PersistedQueryNotFound');

const isPersistedUnsupported = (error: CombinedError): boolean =>
  error.graphQLErrors.some(x => x.message === 'PersistedQueryNotSupported');
