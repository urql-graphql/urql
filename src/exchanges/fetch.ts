import { Observable } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import { Exchange } from '../types';
import { CombinedError } from '../lib/error';

export const fetchExchange: Exchange = () => ops$ =>
  ops$.pipe(
    flatMap(operation => {
      const { url, fetchOptions } = operation.context;
      const { operationName } = operation;

      if (operationName === 'subscription') {
        throw new Error(
          'Received a subscription operation in the httpExchange. You are probably trying to create a subscription. Have you added a subscriptionExchange?'
        );
      }

      const body = JSON.stringify({
        query: operation.query,
        variables: operation.variables,
      });
      // https://developer.mozilla.org/en-US/docs/Web/API/AbortController/AbortController
      const abortController = createAbortController();

      return new Observable(observer => {
        let response;

        fetch(url, {
          body,
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
          signal: abortController.signal,
          ...fetchOptions,
        })
          .then(res => (response = res))
          .then(checkStatus(fetchOptions.redirect))
          .then(res => res.json())
          .then(result => {
            let error;
            if (Array.isArray(result.errors)) {
              error = new CombinedError({
                graphQLErrors: result.errors,
                response,
              });
            }

            observer.next({
              operation,
              data: result.data,
              error,
            });
          })
          .catch(err => {
            if (err.name === 'AbortError') {
              return;
            }

            const error = new CombinedError({
              networkError: err,
              response,
            });

            observer.next({
              operation,
              data: undefined,
              error,
            });
          });

        return () => {
          if (abortController.abort) {
            abortController.abort();
          }
        };
      });
    })
  );

const createAbortController = () => {
  if (typeof AbortController === 'undefined') {
    return { abort: null, signal: undefined };
  }

  return new AbortController();
};

const checkStatus = (redirectMode: string = 'follow') => (
  response: Response
) => {
  // If using manual redirect mode, don't error on redirect!
  const statusRangeEnd = redirectMode === 'manual' ? 400 : 300;
  if (response.status >= 200 && response.status < statusRangeEnd) {
    return response;
  }

  throw new Error(response.statusText);
};
