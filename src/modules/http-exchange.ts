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

  throw new Error(response.statusText);
};

const createAbortController = () => {
  if (typeof AbortController === 'undefined') {
    return { abort: null, signal: undefined };
  }

  return new AbortController();
};

export const httpExchange = (): IExchange => operation => {
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
      method: 'POST',
      signal: abortController.signal,
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
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

        if (result.data) {
          observer.next({
            data: result.data,
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
          response,
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
