import { Source, fromAsyncIterable, filter, pipe } from 'wonka';
import { Operation, OperationResult, ExecutionResult } from '../types';
import { makeResult, makeErrorResult, mergeResultPatch } from '../utils';

const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null;
const boundaryHeaderRe = /boundary="?([^=";]+)"?/i;
const eventStreamRe = /data: ?([^\n]+)/;

type ChunkData = Buffer | Uint8Array;

// NOTE: We're avoiding referencing the `Buffer` global here to prevent
// auto-polyfilling in Webpack
const toString = (input: Buffer | ArrayBuffer): string =>
  input.constructor.name === 'Buffer'
    ? (input as Buffer).toString()
    : decoder!.decode(input as ArrayBuffer);

async function* streamBody(response: Response): AsyncIterableIterator<string> {
  if (response.body![Symbol.asyncIterator]) {
    for await (const chunk of response.body! as any)
      yield toString(chunk as ChunkData);
  } else {
    const reader = response.body!.getReader();
    let result: ReadableStreamReadResult<ChunkData>;
    try {
      while (!(result = await reader.read()).done) yield toString(result.value);
    } finally {
      reader.cancel();
    }
  }
}

async function* split(
  chunks: AsyncIterableIterator<string>,
  boundary: string
): AsyncIterableIterator<string> {
  let buffer = '';
  let boundaryIndex: number;
  for await (const chunk of chunks) {
    buffer += chunk;
    while ((boundaryIndex = buffer.indexOf(boundary)) > -1) {
      yield buffer.slice(0, boundaryIndex);
      buffer = buffer.slice(boundaryIndex + boundary.length);
    }
  }
}

async function* parseJSON(
  response: Response
): AsyncIterableIterator<ExecutionResult> {
  yield JSON.parse(await response.text());
}

async function* parseEventStream(
  response: Response
): AsyncIterableIterator<ExecutionResult> {
  let payload: any;
  for await (const chunk of split(streamBody(response), '\n\n')) {
    const match = chunk.match(eventStreamRe);
    if (match) {
      const chunk = match[1];
      try {
        yield (payload = JSON.parse(chunk));
      } catch (error) {
        if (!payload) throw error;
      }
      if (payload && !payload.hasNext) break;
    }
  }
  if (payload && payload.hasNext) {
    yield { hasNext: false };
  }
}

async function* parseMultipartMixed(
  contentType: string,
  response: Response
): AsyncIterableIterator<ExecutionResult> {
  const boundaryHeader = contentType.match(boundaryHeaderRe);
  const boundary = '\r\n--' + (boundaryHeader ? boundaryHeader[1] : '-');
  let isPreamble = true;
  let payload: any;
  for await (const chunk of split(streamBody(response), boundary)) {
    if (isPreamble) {
      isPreamble = false;
    } else {
      try {
        yield (payload = JSON.parse(
          chunk.slice(chunk.indexOf('\r\n\r\n') + 4)
        ));
      } catch (error) {
        if (!payload) throw error;
      }
    }
    if (payload && !payload.hasNext) break;
  }
  if (payload && payload.hasNext) {
    yield { hasNext: false };
  }
}

async function* fetchOperation(
  operation: Operation,
  url: string,
  fetchOptions: RequestInit
) {
  let networkMode = true;
  let abortController: AbortController | void;
  let result: OperationResult | null = null;
  let response: Response | void;

  try {
    if (typeof AbortController !== 'undefined') {
      fetchOptions.signal = (abortController = new AbortController()).signal;
    }

    // Delay for a tick to give the Client a chance to cancel the request
    // if a teardown comes in immediately
    yield await Promise.resolve();

    response = await (operation.context.fetch || fetch)(url, fetchOptions);
    const contentType = response.headers.get('Content-Type') || '';

    let results: AsyncIterable<ExecutionResult>;
    if (/multipart\/mixed/i.test(contentType)) {
      results = parseMultipartMixed(contentType, response);
    } else if (/text\/event-stream/i.test(contentType)) {
      results = parseEventStream(response);
    } else if (!/text\//i.test(contentType)) {
      results = parseJSON(response);
    } else {
      throw new Error(await response.text());
    }

    for await (const payload of results) {
      result = result
        ? mergeResultPatch(result, payload, response)
        : makeResult(operation, payload, response);
      networkMode = false;
      yield result;
      networkMode = true;
    }

    if (!result) {
      yield (result = makeResult(operation, {}, response));
    }
  } catch (error: any) {
    if (!networkMode) {
      throw error;
    }

    yield makeErrorResult(
      operation,
      response &&
        (response.status < 200 || response.status >= 300) &&
        response.statusText
        ? new Error(response.statusText)
        : error,
      response
    );
  } finally {
    if (abortController) abortController.abort();
  }
}

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
export function makeFetchSource(
  operation: Operation,
  url: string,
  fetchOptions: RequestInit
): Source<OperationResult> {
  return pipe(
    fromAsyncIterable(fetchOperation(operation, url, fetchOptions)),
    filter((result): result is OperationResult => !!result)
  );
}
