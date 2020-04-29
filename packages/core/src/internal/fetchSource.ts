import { Operation, OperationResult, ExchangeInput } from '../types';
import { makeResult, makeErrorResult } from '../utils';
import { make } from 'wonka';

const executeFetch = (
  operation: Operation,
  url: string,
  fetchOptions: RequestInit,
  dispatchDebug: ExchangeInput['dispatchDebug']
): Promise<OperationResult> => {
  const fetcher = operation.context.fetch;

  let statusNotOk = false;
  let response: Response;

  dispatchDebug({
    type: 'fetchRequest',
    message: 'A fetch request is being executed.',
    operation,
    data: {
      url,
      fetchOptions,
    },
  });

  return (fetcher || fetch)(url, fetchOptions)
    .then((res: Response) => {
      response = res;
      statusNotOk =
        res.status < 200 ||
        res.status >= (fetchOptions.redirect === 'manual' ? 400 : 300);
      return res.json();
    })
    .then((result: any) => {
      if (!('data' in result) && !('errors' in result)) {
        throw new Error('No Content');
      }

      dispatchDebug({
        type: result.errors && !result.data ? 'fetchError' : 'fetchSuccess',
        message: `A ${
          result.errors ? 'failed' : 'successful'
        } fetch response has been returned.`,
        operation,
        data: {
          url,
          fetchOptions,
          value: result,
        },
      });

      return makeResult(operation, result, response);
    })
    .catch((error: Error) => {
      if (error.name !== 'AbortError') {
        dispatchDebug({
          type: 'fetchError',
          message: error.name,
          operation,
          data: {
            url,
            fetchOptions,
            value: error,
          },
        });
        return makeErrorResult(
          operation,
          statusNotOk ? new Error(response.statusText) : error,
          response
        );
      }
    }) as Promise<OperationResult>;
};

export const makeFetchSource = (
  operation: Operation,
  url: string,
  fetchOptions: RequestInit,
  dispatchDebug: ExchangeInput['dispatchDebug']
) => {
  return make<OperationResult>(({ next, complete }) => {
    const abortController =
      typeof AbortController !== 'undefined' ? new AbortController() : null;

    let ended = false;

    Promise.resolve()
      .then(() => {
        if (ended) {
          return;
        } else if (abortController) {
          fetchOptions.signal = abortController.signal;
        }

        return executeFetch(operation, url, fetchOptions, dispatchDebug);
      })
      .then((result: OperationResult | undefined) => {
        if (!ended) {
          ended = true;
          if (result) next(result);
          complete();
        }
      });

    return () => {
      ended = true;
      if (abortController) {
        abortController.abort();
      }
    };
  });
};
