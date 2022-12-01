import { Source, fromAsyncIterable } from 'wonka';
import { Operation, OperationResult } from '../types';
import { makeResult, makeErrorResult, mergeResultPatch } from '../utils';

const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null;
const jsonHeaderRe = /content-type:[^\r\n]*application\/json/i;
const boundaryHeaderRe = /boundary="?([^=";]+)"?/i;

type ChunkData = Buffer | Uint8Array;

// NOTE: We're avoiding referencing the `Buffer` global here to prevent
// auto-polyfilling in Webpack
const toString = (input: Buffer | ArrayBuffer): string =>
  input.constructor.name === 'Buffer'
    ? (input as Buffer).toString()
    : decoder!.decode(input as ArrayBuffer);

async function* fetchOperation(
  operation: Operation,
  url: string,
  fetchOptions: RequestInit
) {
  let abortController: AbortController | void;
  let response: Response;
  let hasResults = false;
  let statusNotOk = false;

  try {
    if (typeof AbortController !== 'undefined') {
      fetchOptions.signal = (abortController = new AbortController()).signal;
    }

    // Delay for a tick to give the Client a chance to cancel the request
    // if a teardown comes in immediately
    await Promise.resolve();

    response = await (operation.context.fetch || fetch)(url, fetchOptions);
    statusNotOk =
      response.status < 200 ||
      response.status >= (fetchOptions.redirect === 'manual' ? 400 : 300);

    const contentType =
      (response.headers && response.headers.get('Content-Type')) || '';
    if (/text\//i.test(contentType)) {
      const text = await response.text();
      return yield makeErrorResult(operation, new Error(text), response);
    } else if (!/multipart\/mixed/i.test(contentType)) {
      const text = await response.text();
      return yield makeResult(operation, JSON.parse(text), response);
    }

    let boundary = '---';
    const boundaryHeader = contentType.match(boundaryHeaderRe);
    if (boundaryHeader) boundary = '--' + boundaryHeader[1];

    let iterator: AsyncIterableIterator<ChunkData>;
    if (response[Symbol.asyncIterator]) {
      iterator = response[Symbol.asyncIterator]();
    } else if (response.body) {
      const reader = response.body.getReader();
      iterator = {
        next() {
          return reader.read() as Promise<IteratorResult<ChunkData>>;
        },
        [Symbol.asyncIterator]() {
          return iterator;
        },
      };
    } else {
      throw new TypeError('Streaming requests unsupported');
    }

    let buffer = '';
    let isPreamble = true;
    let nextResult: OperationResult | null = null;
    let prevResult: OperationResult | null = null;
    for await (const data of iterator) {
      hasResults = true;

      const chunk = toString(data);
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
              nextResult = prevResult = prevResult
                ? mergeResultPatch(prevResult, payload, response)
                : makeResult(operation, payload, response);
            } catch (_error) {}
          }

          if (next.slice(0, 2) === '--' || (payload && !payload.hasNext)) {
            if (!prevResult) yield makeResult(operation, {}, response);
            break;
          }
        }

        buffer = next;
        boundaryIndex = buffer.indexOf(boundary);
      }

      if (nextResult) {
        yield nextResult;
        nextResult = null;
      }
    }
  } catch (error: any) {
    if (hasResults) {
      throw error;
    }

    yield makeErrorResult(
      operation,
      statusNotOk
        ? response!.statusText
          ? new Error(response!.statusText)
          : error
        : error,
      response!
    );
  } finally {
    abortController?.abort();
  }
}

export function makeFetchSource(
  operation: Operation,
  url: string,
  fetchOptions: RequestInit
): Source<OperationResult> {
  return fromAsyncIterable(fetchOperation(operation, url, fetchOptions));
}
