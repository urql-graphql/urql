import { make } from 'wonka';
import { Operation, OperationResult } from '../types';
import { makeResult, makeErrorResult, mergeResultPatch } from '../utils';

const asyncIterator =
  typeof Symbol !== 'undefined' ? Symbol.asyncIterator : null;
const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null;
const jsonHeaderRe = /content-type:[^\r\n]*application\/json/i;
const boundaryHeaderRe = /boundary="?([^=";]+)"?/i;

type ChunkData = { done: false; value: Buffer | Uint8Array } | { done: true };

interface AbstractReader {
  next?(): Promise<ChunkData>;
  read?(): Promise<ChunkData>;
  cancel?(): void;
}

const toString = (input: Buffer | ArrayBuffer): string =>
  typeof Buffer !== 'undefined' && Buffer.isBuffer(input)
    ? input.toString()
    : decoder!.decode(input);

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
  if (!/multipart\/mixed/i.test(contentType)) {
    return response.json().then(payload => {
      onResult(makeResult(operation, payload, response));
    });
  }

  let boundary = '-';
  const boundaryHeader = contentType.match(boundaryHeaderRe);
  if (boundaryHeader) boundary = boundaryHeader[1];

  let iterator: AbstractReader;
  if (asyncIterator && response[asyncIterator]) {
    iterator = response[asyncIterator]();
  } else if ('body' in response && response.body) {
    iterator = response.body.getReader();
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
          const body = current.slice(headersEnd, current.lastIndexOf('\r\n'));

          let payload: any;
          if (jsonHeaderRe.test(headers)) {
            try {
              payload = JSON.parse(body);
              prevResult = nextResult = prevResult
                ? mergeResultPatch(prevResult, payload, response)
                : makeResult(operation, payload, response);
            } catch (_error) {}
          }

          if (
            next.slice(0, 2) === '--' ||
            (payload && payload.hasNext === false)
          ) {
            // break on tail boundary or when payload indicates no more results
            if (nextResult) {
              onResult(nextResult);
            } else if (!prevResult) {
              onResult(makeResult(operation, {}, response));
            }

            return;
          }
        }

        buffer = next;
        boundaryIndex = buffer.indexOf(boundary);
      }
    }

    if (nextResult) {
      onResult(nextResult);
      nextResult = null;
    }

    if (!data.done) {
      return (iterator.next || iterator.read)!().then(next);
    }
  }

  return (iterator.next || iterator.read)!()
    .then(next)
    .finally(() => {
      if (iterator.cancel) iterator.cancel();
    });
};

export const makeFetchSource = (
  operation: Operation,
  url: string,
  fetchOptions: RequestInit
) => {
  const maxStatus = fetchOptions.redirect === 'manual' ? 400 : 300;
  const fetcher = operation.context.fetch;

  return make<OperationResult>(({ next, complete }) => {
    const abortController =
      typeof AbortController !== 'undefined' ? new AbortController() : null;
    if (abortController) {
      fetchOptions.signal = abortController.signal;
    }

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
        if (error.name !== 'AbortError') {
          const result = makeErrorResult(
            operation,
            statusNotOk ? new Error(response.statusText) : error,
            response
          );

          next(result);
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
