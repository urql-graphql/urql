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
  FetchBody,
  makeFetchBody,
  makeFetchURL,
  makeFetchOptions,
  makeFetchSource,
} from '@urql/core/internal';

import { hash } from './sha256';

export const persistedFetchExchange: Exchange = ({
  forward,
  dispatchDebug,
}) => {
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

        const body = makeFetchBody(operation);
        if (!supportsPersistedQueries) {
          // Runs the usual non-persisted fetchExchange query logic
          return pipe(
            makePersistedFetchSource(operation, body, dispatchDebug),
            takeUntil(teardown$)
          );
        }

        const query: string = body.query!;

        return pipe(
          // Hash the given GraphQL query
          fromPromise(hash(query)),
          mergeMap(sha256Hash => {
            // Attach SHA256 hash and remove query from body
            body.query = undefined;
            body.extensions = {
              persistedQuery: {
                version: 1,
                sha256Hash,
              },
            };

            return makePersistedFetchSource(operation, body, dispatchDebug);
          }),
          mergeMap(result => {
            if (result.error && isPersistedUnsupported(result.error)) {
              // Reset the body back to its non-persisted state
              body.query = query;
              body.extensions = undefined;
              // Disable future persisted queries
              supportsPersistedQueries = false;
              return makePersistedFetchSource(operation, body, dispatchDebug);
            } else if (result.error && isPersistedMiss(result.error)) {
              // Add query to the body but leave SHA256 hash intact
              body.query = query;
              return makePersistedFetchSource(operation, body, dispatchDebug);
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
  operation: Operation,
  body: FetchBody,
  dispatchDebug: ExchangeInput['dispatchDebug']
): Source<OperationResult> => {
  const url = makeFetchURL(
    operation,
    body.query ? body : { ...body, query: '' }
  );
  const fetchOptions = makeFetchOptions(operation, body);

  dispatchDebug({
    type: 'fetchRequest',
    message: !body.query
      ? 'A fetch request for a persisted query is being executed.'
      : 'A fetch request is being executed.',
    operation,
    data: {
      url,
      fetchOptions,
    },
  });

  return pipe(
    makeFetchSource(operation, url, fetchOptions),
    onPush(result => {
      const persistFail =
        result.error &&
        (isPersistedMiss(result.error) || isPersistedUnsupported(result.error));

      if (persistFail || (!result.data && result.error)) {
        dispatchDebug({
          // TODO: Assign a new name to this once @urql/devtools supports it
          type: 'fetchError',
          message: persistFail
            ? 'A Persisted Query request has failed. A non-persisted GraphQL request will follow.'
            : 'A failed fetch response has been returned.',
          operation,
          data: {
            url,
            fetchOptions,
            value: result.error!.networkError || result.error!,
          },
        });
      } else {
        dispatchDebug({
          type: 'fetchSuccess',
          message: 'A successful fetch response has been returned.',
          operation,
          data: {
            url,
            fetchOptions,
            value: {
              data: result.data,
              errors: result.error ? result.error.graphQLErrors : undefined,
              extensions: result.extensions,
            },
          },
        });
      }
    })
  );
};

const isPersistedMiss = (error: CombinedError): boolean =>
  error.graphQLErrors.some(x => x.message === 'PersistedQueryNotFound');

const isPersistedUnsupported = (error: CombinedError): boolean =>
  error.graphQLErrors.some(x => x.message === 'PersistedQueryNotSupported');
