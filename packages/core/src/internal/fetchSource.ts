import { MultipartPayload, Operation, OperationResult } from '../types';
import { makeResult, makeErrorResult } from '../utils';
import { make } from 'wonka';
import { meros } from 'meros';
import { dset } from 'dset/merge';

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

        const result = meros<MultipartPayload>(res, {
          multiple: true,
        });

        return result.then(maybeData => {
          if (isAsyncIterable(maybeData)) {
            return (function loop(payloadPromise) {
              return payloadPromise.then(parts => {
                if (parts.done) return;

                const result = {
                  data: {},
                  errors: [],
                } as any;

                // eslint-disable-next-line es5/no-for-of
                for (const part of parts.value) {
                  if (!part.json)
                    throw new Error(
                      `Expected content-type json, but received ${part.headers['content-type']}`
                    );

                  if (!('data' in part.body) && !('errors' in part.body))
                    throw new Error('No Content');

                  dset(result.data, part.body.path, part.body.data);
                  if (part.body.error) result.errors.push(...part.body.error);
                }

                // in the absence of errors — the field should not exist
                if (!result.errors.length) result.errors = undefined;

                next(makeResult(operation, result, response));

                return loop(maybeData.next());
              });
            })(maybeData.next()).then(() => {
              complete();
            });
          } else {
            return res.json().then(result => {
              if (!('data' in result) && !('errors' in result))
                throw new Error('No Content');

              result = makeResult(operation, result, response);
              if (result) next(result);
              complete();
            });
          }
        });
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

function isAsyncIterable(input: unknown): input is AsyncIterable<unknown> {
  return (
    typeof input === 'object' &&
    input !== null &&
    // Some browsers still don't have Symbol.asyncIterator implemented (iOS Safari)
    // That means every custom AsyncIterable must be built using a AsyncGeneratorFunction (async function * () {})
    ((input as any)[Symbol.toStringTag] === 'AsyncGenerator' ||
      Symbol.asyncIterator in input)
  );
}
