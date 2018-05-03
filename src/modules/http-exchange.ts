import Observable from 'zen-observable-ts';

import { IExchange } from '../interfaces/exchange';

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

export const httpExchange: IExchange = operation => {
  const { context } = operation;

  const body = JSON.stringify({
    query: operation.query,
    variables: operation.variables,
  });

  // https://developer.mozilla.org/en-US/docs/Web/API/AbortController/AbortController
  const abortController = createAbortController();

  const fetchOptions =
    typeof context.fetchOptions === 'function'
      ? context.fetchOptions()
      : context.fetchOptions;

  return new Observable(observer => {
    fetch(context.url, {
      body,
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: abortController.signal,
      ...fetchOptions,
    })
      .then(checkStatus(fetchOptions.redirect))
      .then(res => res.json())
      .then(response => {
        if (response.data) {
          observer.next(response);
          observer.complete();
        } else {
          observer.error(new Error('No data'));
        }
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          return;
        }

        observer.error(err);
      });

    return () => {
      if (abortController.abort) {
        abortController.abort();
      }
    };
  });
};
