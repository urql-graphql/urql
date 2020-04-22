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

import { hash } from './sha256';

export const persistedFetchExchange: Exchange = ({ forward }) => {
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
