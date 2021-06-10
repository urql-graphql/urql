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
    let catch_response: Response;

    Promise.resolve()
      .then(() => {
        if (ended) {
          return;
        } else if (abortController) {
          fetchOptions.signal = abortController.signal;
        }

        // Does the fetch call — handling any network level errors, like not 200's
        return fetcher(url, fetchOptions).then((response: Response) => {
          catch_response = response;

          if (
            response.status < 200 ||
            response.status >= (fetchOptions.redirect === 'manual' ? 400 : 300)
          ) {
            throw new Error(response.statusText);
          }

          return response;
        });
      })
      // now we handle the maybe response
      .then(async (response: Response | undefined) => {
        if (!response || ended) return;

        const networkResult = await response.json();

        if (!('data' in networkResult) && !('errors' in networkResult))
          throw new Error('No Content');

        if (ended) return;

        const result = makeResult(operation, networkResult, response);
        if (result) next(result);
      })
      .catch((error: Error) => {
        if (error.name === 'AbortError') return;

        next(makeErrorResult(operation, error, catch_response));
      })
      .finally(() => complete());

    return () => {
      ended = true;
      if (abortController) abortController.abort();
    };
  });
};
