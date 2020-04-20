import { Operation, OperationResult } from '../types';
import { makeResult, makeErrorResult } from '../utils';
import { make } from 'wonka';

const executeFetch = (
  operation: Operation,
  url: string,
  fetchOptions: RequestInit
): Promise<OperationResult> => {
  const fetcher = operation.context.fetch;

  let statusNotOk = false;
  let response: Response;

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

      return makeResult(operation, result, response);
    })
    .catch((error: Error) => {
      if (error.name !== 'AbortError') {
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
  fetchOptions: RequestInit
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

        return executeFetch(operation, url, fetchOptions);
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
