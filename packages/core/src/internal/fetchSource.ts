import { Source, make } from 'wonka';
import { Operation, OperationResult } from '../types';
import { makeResult, makeErrorResult, mergeResultPatch } from '../utils';

const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null;
const jsonHeaderRe = /content-type:[^\r\n]*application\/json/i;
const boundaryHeaderRe = /boundary="?([^=";]+)"?/i;

type ChunkData = { done: false; value: Buffer | Uint8Array } | { done: true };

// NOTE: We're avoiding referencing the `Buffer` global here to prevent
// auto-polyfilling in Webpack
const toString = (input: Buffer | ArrayBuffer): string =>
  input.constructor.name === 'Buffer'
    ? (input as Buffer).toString()
    : decoder!.decode(input as ArrayBuffer);

/** Makes a GraphQL HTTP request to a given API by wrapping around the Fetch API.
 *
 * @param operation - The {@link Operation} that should be sent via GraphQL over HTTP.
 * @param url - The endpoint URL for the GraphQL HTTP API.
 * @param fetchOptions - The {@link RequestInit} fetch options for the request.
 * @returns A Wonka {@link Source} of {@link OperationResult | OperationResults}.
 *
 * @remarks
 * This utility defines how all built-in fetch exchanges make GraphQL HTTP requests,
 * supporting multipart incremental responses, cancellation and other smaller
 * implementation details.
 *
 * If you’re implementing a modified fetch exchange for a GraphQL over HTTP API
 * it’s recommended you use this utility.
 *
 * Hint: This function does not use the passed `operation` to create or modify the
 * `fetchOptions` and instead expects that the options have already been created
 * using {@link makeFetchOptions} and modified as needed.
 *
 * @throws
 * If the `fetch` polyfill or globally available `fetch` function doesn’t support
 * streamed multipart responses while trying to handle a `multipart/mixed` GraphQL response,
 * the source will throw “Streaming requests unsupported”.
 * This shouldn’t happen in modern browsers and Node.js.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API} for the Fetch API spec.
 */
export const makeFetchSource = (
  operation: Operation,
  url: string,
  fetchOptions: RequestInit
): Source<OperationResult> => {
  const maxStatus = fetchOptions.redirect === 'manual' ? 400 : 300;
  const fetcher = operation.context.fetch;

  return make<OperationResult>(({ next, complete }) => {
    const abortController =
      typeof AbortController !== 'undefined' ? new AbortController() : null;
    if (abortController) {
      fetchOptions.signal = abortController.signal;
    }

    let hasResults = false;
    // DERIVATIVE: Copyright (c) 2021 Marais Rossouw <hi@marais.io>
    // See: https://github.com/maraisr/meros/blob/219fe95/src/browser.ts
    const executeIncrementalFetch = (
      onResult: (result: OperationResult) => void,
      operation: Operation,
      response: Response
    ): Promise<void> => {
      // NOTE: Guarding against fetch polyfills here
      const contentType =
        (response.headers && response.headers.get('Content-Type')) || '';
      if (/text\//i.test(contentType)) {
        return response.text().then(text => {
          onResult(makeErrorResult(operation, new Error(text), response));
        });
      } else if (!/multipart\/mixed/i.test(contentType)) {
        return response.text().then(payload => {
          onResult(makeResult(operation, JSON.parse(payload), response));
        });
      }

      let boundary = '---';
      const boundaryHeader = contentType.match(boundaryHeaderRe);
      if (boundaryHeader) boundary = '--' + boundaryHeader[1];

      let read: () => Promise<ChunkData>;
      let cancel = () => {
        /*noop*/
      };
      if (response[Symbol.asyncIterator]) {
        const iterator = response[Symbol.asyncIterator]();
        read = iterator.next.bind(iterator);
      } else if ('body' in response && response.body) {
        const reader = response.body.getReader();
        cancel = () => reader.cancel();
        read = () => reader.read();
      } else {
        throw new TypeError('Streaming requests unsupported');
      }

      let buffer = '';
      let isPreamble = true;
      let nextResult: OperationResult | null = null;
      let prevResult: OperationResult | null = null;

      function next(data: ChunkData): Promise<void> | void {
        if (!data.done) {
          const chunk = toString(data.value);
          let boundaryIndex = chunk.indexOf(boundary);
          if (boundaryIndex > -1) {
            boundaryIndex += buffer.length;
          } else {
            boundaryIndex = buffer.indexOf(boundary);
          }

          buffer += chunk;
          while (boundaryIndex > -1) {
            const current = buffer.slice(0, boundaryIndex);
            const next = buffer.slice(boundaryIndex + boundary.length);

            if (isPreamble) {
              isPreamble = false;
            } else {
              const headersEnd = current.indexOf('\r\n\r\n') + 4;
              const headers = current.slice(0, headersEnd);
              const body = current.slice(
                headersEnd,
                current.lastIndexOf('\r\n')
              );

              let payload: any;
              if (jsonHeaderRe.test(headers)) {
                try {
                  payload = JSON.parse(body);
                  nextResult = prevResult = prevResult
                    ? mergeResultPatch(prevResult, payload, response)
                    : makeResult(operation, payload, response);
                } catch (_error) {}
              }

              if (next.slice(0, 2) === '--' || (payload && !payload.hasNext)) {
                if (!prevResult)
                  return onResult(makeResult(operation, {}, response));
                break;
              }
            }

            buffer = next;
            boundaryIndex = buffer.indexOf(boundary);
          }
        } else {
          hasResults = true;
        }

        if (nextResult) {
          onResult(nextResult);
          nextResult = null;
        }

        if (!data.done && (!prevResult || prevResult.hasNext)) {
          return read().then(next);
        }
      }

      return read().then(next).finally(cancel);
    };

    let ended = false;
    let statusNotOk = false;
    let response: Response;

    Promise.resolve()
      .then(() => {
        if (ended) return;
        return (fetcher || fetch)(url, fetchOptions);
      })
      .then((_response: Response | void) => {
        if (!_response) return;
        response = _response;
        statusNotOk = response.status < 200 || response.status >= maxStatus;
        return executeIncrementalFetch(next, operation, response);
      })
      .then(complete)
      .catch((error: Error) => {
        if (hasResults) {
          throw error;
        }

        const result = makeErrorResult(
          operation,
          statusNotOk
            ? response.statusText
              ? new Error(response.statusText)
              : error
            : error,
          response
        );

        next(result);
        complete();
      });

    return () => {
      ended = true;
      if (abortController) {
        abortController.abort();
      }
    };
  });
};
