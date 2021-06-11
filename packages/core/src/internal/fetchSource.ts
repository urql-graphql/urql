import { Operation, OperationResult } from '../types';
import { makeResult, makeErrorResult } from '../utils';
import { make } from 'wonka';

export const makeFetchSource = (
  operation: Operation,
  url: string,
  fetchOptions: RequestInit
) => {
  return make<OperationResult>(({ next, complete }) => {
    const abortController =
      typeof AbortController !== 'undefined' ? new AbortController() : null;

    const fetcher = operation.context.fetch || fetch;

    let ended = false;
    let statusNotOk = false;
    let response: Response;

    Promise.resolve()
      .then(() => {
        if (ended) {
          return;
        } else if (abortController) {
          fetchOptions.signal = abortController.signal;
        }

        return fetcher(url, fetchOptions).then((res: Response) => {
          statusNotOk =
            res.status < 200 ||
            res.status >= (fetchOptions.redirect === 'manual' ? 400 : 300);

          return (response = res);
        });
      })
      .then((res: Response | undefined) => {
        if (!res || ended) throw new Error('bail early');

        return res.json();
      })
      .then((result: OperationResult) => {
        if (!('data' in result) && !('errors' in result))
          throw new Error('No Content');

        result = makeResult(operation, result, response);
        if (result) next(result);
        complete();
      })
      .catch((error: Error) => {
        if (error.name === 'AbortError') return void complete();
        if (error.message === 'bail early') return void complete();

        next(
          makeErrorResult(
            operation,
            statusNotOk ? new Error(response.statusText) : error,
            response
          )
        );
        complete();
      });

    return () => {
      ended = true;
      if (abortController) abortController.abort();
    };
  });
};
