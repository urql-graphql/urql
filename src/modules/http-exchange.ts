import Observable from 'zen-observable-ts';

import { IExchange } from '../interfaces/index';
import { CombinedError } from './error';

const checkStatus = (redirectMode: string = 'follow') => (
  response: Response
) => {
  // If using manual redirect mode, don't error on redirect!
  const statusRangeEnd = redirectMode === 'manual' ? 400 : 300;
  if (response.status >= 200 && response.status < statusRangeEnd) {
    return response;
  }
  const err = new Error(response.statusText);
  (err as any).response = response;
  throw err;
};

const createAbortController = () => {
  if (typeof AbortController === 'undefined') {
    return { abort: null, signal: undefined };
  }

  return new AbortController();
};

export const httpExchange = (): IExchange => operation => {
  const { url, fetchOptions } = operation.context;

  const body = JSON.stringify({
    query: operation.query,
    variables: operation.variables,
  });

  // https://developer.mozilla.org/en-US/docs/Web/API/AbortController/AbortController
  const abortController = createAbortController();

  return new Observable(observer => {
    fetch(url, {
      body,
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: abortController.signal,
      ...fetchOptions,
    })
      .then(checkStatus(fetchOptions.redirect))
      .then(res => res.json())
      .then(response => {
        let error;
        if (Array.isArray(response.errors)) {
          error = new CombinedError({
            graphQLErrors: response.errors,
          });
        }
        if (response.data) {
          observer.next({
            data: response.data,
            error,
          });
          observer.complete();
        } else if (error) {
          observer.error(error);
        } else {
          observer.error(new Error('no data or error'));
        }
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          return;
        }

        const error = new CombinedError({
          networkError: err,
        });
        observer.error(error);
      });

    return () => {
      if (abortController.abort) {
        abortController.abort();
      }
    };
  });
};
