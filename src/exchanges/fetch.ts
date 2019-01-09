import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { CombinedError } from '../lib';
import { Exchange, Operation, ExchangeResult } from '../types';

/** A default exchange for fetching GraphQL requests. */
export const fetchExchange: Exchange = () => {
  return ops$ =>
    ops$.pipe(
      mergeMap(operation => {
        if (operation.operationName === 'subscription') {
          throw new Error(
            'Received a subscription operation in the httpExchange. You are probably trying to create a subscription. Have you added a subscriptionExchange?'
          );
        }

        return new Observable<ExchangeResult>(observer => {
          const abortController =
            typeof AbortController !== 'undefined'
              ? new AbortController()
              : undefined;

          const fetchOptions = {
            body: JSON.stringify({
              query: operation.query,
              variables: operation.variables,
            }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            signal:
              abortController !== undefined
                ? abortController.signal
                : undefined,
            ...operation.context.fetchOptions,
          };

          executeFetch(operation, fetchOptions)
            .then(result => {
              if (result !== undefined) {
                observer.next(result);
              }

              observer.complete();
            })
            .catch(err => {
              console.error(err);
              observer.complete();
            });

          return () => {
            if (abortController !== undefined) {
              abortController.abort();
            }
          };
        });
      })
    );
};

const executeFetch = async (operation: Operation, opts: RequestInit) => {
  let response: Response;

  try {
    const { url } = operation.context;
    response = await fetch(url, opts);

    checkStatus(opts.redirect, response);
    const result = await response.json();

    return {
      operation,
      data: result.data,
      error: Array.isArray(result.errors)
        ? new CombinedError({
            graphQLErrors: result.errors,
            response,
          })
        : undefined,
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      return undefined;
    }

    return {
      operation,
      data: undefined,
      error: new CombinedError({
        networkError: err,
        response,
      }),
    };
  }
};

const checkStatus = (redirectMode: string = 'follow', response: Response) => {
  const statusRangeEnd = redirectMode === 'manual' ? 400 : 300;

  if (response.status < 200 || response.status > statusRangeEnd) {
    throw new Error(response.statusText);
  }
};
