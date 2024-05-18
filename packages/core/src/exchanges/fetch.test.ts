import { empty, fromValue, pipe, Source, subscribe, toPromise } from 'wonka';
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

import { Client } from '../client';
import { makeOperation } from '../utils';
import { queryOperation } from '../test-utils';
import { OperationResult } from '../types';
import { fetchExchange } from './fetch';

const fetch = (globalThis as any).fetch as Mock;
const abort = vi.fn();

const abortError = new Error();
abortError.name = 'AbortError';

beforeAll(() => {
  (globalThis as any).AbortController = function AbortController() {
    this.signal = undefined;
    this.abort = abort;
  };
});

afterEach(() => {
  fetch.mockClear();
  abort.mockClear();
});

afterAll(() => {
  (globalThis as any).AbortController = undefined;
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
  dispatchDebug: vi.fn(),
  forward: () => empty as Source<OperationResult>,
  client: {
    debugTarget: {
      dispatchEvent: vi.fn(),
    },
  } as any as Client,
};

describe('on success', () => {
  beforeEach(() => {
    fetch.mockResolvedValue({
      status: 200,
      headers: { get: () => 'application/json' },
      text: vi.fn().mockResolvedValue(response),
    });
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
      fetchExchange(exchangeArgs),
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
      headers: { get: () => 'application/json' },
      text: vi.fn().mockResolvedValue(JSON.stringify({})),
    });
  });

  it('returns error data', async () => {
    const data = await pipe(
      fromValue(queryOperation),
      fetchExchange(exchangeArgs),
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
      fetchExchange(exchangeArgs),
      toPromise
    );

    expect(data).toMatchSnapshot();
  });

  it('ignores the error when a result is available', async () => {
    fetch.mockResolvedValue({
      status: 400,
      headers: { get: () => 'application/json' },
      text: vi.fn().mockResolvedValue(response),
    });

    const data = await pipe(
      fromValue(queryOperation),
      fetchExchange(exchangeArgs),
      toPromise
    );

    expect(data.data).toEqual(JSON.parse(response).data);
  });
});

describe('on teardown', () => {
  const fail = () => {
    expect(true).toEqual(false);
  };

  it('does not start the outgoing request on immediate teardowns', async () => {
    fetch.mockImplementation(async () => {
      await new Promise(() => {
        /*noop*/
      });
    });

    const { unsubscribe } = pipe(
      fromValue(queryOperation),
      fetchExchange(exchangeArgs),
      subscribe(fail)
    );

    unsubscribe();

    // NOTE: We can only observe the async iterator's final run after a macro tick
    await new Promise(resolve => setTimeout(resolve));
    expect(fetch).toHaveBeenCalledTimes(0);
    expect(abort).toHaveBeenCalledTimes(1);
  });

  it('aborts the outgoing request', async () => {
    fetch.mockResolvedValue({
      status: 200,
      headers: new Map([['Content-Type', 'application/json']]),
      text: vi.fn().mockResolvedValue('{ "data": null }'),
    });

    const { unsubscribe } = pipe(
      fromValue(queryOperation),
      fetchExchange(exchangeArgs),
      subscribe(() => {
        /*noop*/
      })
    );

    await new Promise(resolve => setTimeout(resolve));
    unsubscribe();

    // NOTE: We can only observe the async iterator's final run after a macro tick
    await new Promise(resolve => setTimeout(resolve));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(abort).toHaveBeenCalledTimes(1);
  });

  it('does not call the query', () => {
    fetch.mockResolvedValue(new Response('text', { status: 200 }));

    pipe(
      fromValue(
        makeOperation('teardown', queryOperation, queryOperation.context)
      ),
      fetchExchange(exchangeArgs),
      subscribe(fail)
    );

    expect(fetch).toHaveBeenCalledTimes(0);
    expect(abort).toHaveBeenCalledTimes(0);
  });
});
