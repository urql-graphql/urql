import { Client, OperationResult } from '@urql/core';
import { empty, fromValue, pipe, Source, toPromise } from 'wonka';

import {
  vi,
  expect,
  it,
  beforeEach,
  describe,
  beforeAll,
  Mock,
  afterEach,
  afterAll,
} from 'vitest';

import { multipartFetchExchange } from './multipartFetchExchange';

import {
  uploadOperation,
  queryOperation,
  multipleUploadOperation,
} from './test-utils';

const fetch = (global as any).fetch as Mock;
const abort = vi.fn();

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

const response = JSON.stringify({
  status: 200,
  data: {
    data: {
      user: 1200,
    },
  },
});

const exchangeArgs = {
  forward: () => empty as Source<OperationResult>,
  client: {} as Client,
  dispatchDebug: vi.fn(),
};

describe('on success', () => {
  beforeEach(() => {
    fetch.mockResolvedValue({
      status: 200,
      text: vi.fn().mockResolvedValue(response),
    });
  });

  it('uses a file when given', async () => {
    const fetchOptions = vi.fn().mockReturnValue({});

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
    const fetchOptions = vi.fn().mockReturnValue({});

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
    const fetchOptions = vi.fn().mockReturnValue({});

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
      text: vi.fn().mockResolvedValue('{}'),
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
    const fetchOptions = vi.fn().mockReturnValue({ redirect: 'manual' });

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

  it('ignores the error when a result is available', async () => {
    fetch.mockResolvedValue({
      status: 400,
      text: vi.fn().mockResolvedValue(response),
    });

    const data = await pipe(
      fromValue(queryOperation),
      multipartFetchExchange(exchangeArgs),
      toPromise
    );

    expect(data.data).toEqual(JSON.parse(response).data);
  });
});
