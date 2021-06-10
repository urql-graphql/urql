import { Client, OperationResult, makeOperation } from '@urql/core';
import { empty, fromValue, pipe, Source, subscribe, toPromise } from 'wonka';

import { multipartFetchExchange } from './multipartFetchExchange';

import {
  uploadOperation,
  queryOperation,
  multipleUploadOperation,
} from './test-utils';

const fetch = (global as any).fetch as jest.Mock;
const abort = jest.fn();

const abortError = new Error();
abortError.name = 'AbortError';

beforeAll(() => {
  (global as any).AbortController = function AbortController() {
    this.signal = undefined;
    this.abort = abort;
  };
});

afterEach(() => {
  fetch.mockClear();
  abort.mockClear();
});

afterAll(() => {
  (global as any).AbortController = undefined;
});

const response = {
  status: 200,
  data: {
    data: {
      user: 1200,
    },
  },
};

const exchangeArgs = {
  forward: () => empty as Source<OperationResult>,
  client: {} as Client,
  dispatchDebug: jest.fn(),
};

describe('on success', () => {
  beforeEach(() => {
    fetch.mockResolvedValue({
      status: 200,
      json: jest.fn().mockResolvedValue(response),
    });
  });

  it('uses a file when given', async () => {
    const fetchOptions = jest.fn().mockReturnValue({});

    const data = await pipe(
      fromValue({
        ...uploadOperation,
        context: {
          ...uploadOperation.context,
          fetchOptions,
        },
      }),
      multipartFetchExchange(exchangeArgs),
      toPromise
    );

    expect(data).toMatchSnapshot();
    expect(fetchOptions).toHaveBeenCalled();
    expect(fetch.mock.calls[0][1].headers).toMatchSnapshot();
    expect(fetch.mock.calls[0][1].body).toMatchSnapshot();
  });

  it('uses multiple files when given', async () => {
    const fetchOptions = jest.fn().mockReturnValue({});

    const data = await pipe(
      fromValue({
        ...multipleUploadOperation,
        context: {
          ...multipleUploadOperation.context,
          fetchOptions,
        },
      }),
      multipartFetchExchange(exchangeArgs),
      toPromise
    );

    expect(data).toMatchSnapshot();
    expect(fetchOptions).toHaveBeenCalled();
    expect(fetch.mock.calls[0][1].headers).toMatchSnapshot();
    expect(fetch.mock.calls[0][1].body).toMatchSnapshot();
  });

  it('returns response data', async () => {
    const fetchOptions = jest.fn().mockReturnValue({});

    const data = await pipe(
      fromValue({
        ...queryOperation,
        context: {
          ...queryOperation.context,
          fetchOptions,
        },
      }),
      multipartFetchExchange(exchangeArgs),
      toPromise
    );

    expect(data).toMatchSnapshot();
    expect(fetchOptions).toHaveBeenCalled();
    expect(fetch.mock.calls[0][1].body).toMatchSnapshot();
  });
});

describe('on error', () => {
  beforeEach(() => {
    fetch.mockResolvedValue({
      status: 400,
      json: jest.fn().mockResolvedValue({}),
    });
  });

  it('returns error data', async () => {
    const data = await pipe(
      fromValue(queryOperation),
      multipartFetchExchange(exchangeArgs),
      toPromise
    );

    expect(data).toMatchSnapshot();
  });

  it('returns error data with status 400 and manual redirect mode', async () => {
    const fetchOptions = jest.fn().mockReturnValue({ redirect: 'manual' });

    const data = await pipe(
      fromValue({
        ...queryOperation,
        context: {
          ...queryOperation.context,
          fetchOptions,
        },
      }),
      multipartFetchExchange(exchangeArgs),
      toPromise
    );

    expect(data).toMatchSnapshot();
  });

  it.skip('ignores the error when a result is available', async () => {
    fetch.mockResolvedValue({
      status: 400,
      json: jest.fn().mockResolvedValue(response),
    });

    const data = await pipe(
      fromValue(queryOperation),
      multipartFetchExchange(exchangeArgs),
      toPromise
    );

    expect(data.data).toEqual(response.data);
  });
});

describe('on teardown', () => {
  it('does not start the outgoing request on immediate teardowns', () => {
    fetch.mockRejectedValueOnce(abortError);

    const { unsubscribe } = pipe(
      fromValue(queryOperation),
      multipartFetchExchange(exchangeArgs),
      subscribe(fail)
    );

    unsubscribe();
    expect(fetch).toHaveBeenCalledTimes(0);
    expect(abort).toHaveBeenCalledTimes(1);
  });

  it('aborts the outgoing request', async () => {
    fetch.mockRejectedValueOnce(abortError);

    const { unsubscribe } = pipe(
      fromValue(queryOperation),
      multipartFetchExchange(exchangeArgs),
      subscribe(fail)
    );

    await Promise.resolve();

    unsubscribe();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(abort).toHaveBeenCalledTimes(1);
  });

  it('does not call the query', () => {
    pipe(
      fromValue(
        makeOperation('teardown', queryOperation, queryOperation.context)
      ),
      multipartFetchExchange(exchangeArgs),
      subscribe(fail)
    );

    expect(fetch).toHaveBeenCalledTimes(0);
    expect(abort).toHaveBeenCalledTimes(0);
  });
});
