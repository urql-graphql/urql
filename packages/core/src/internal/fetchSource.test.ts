import { pipe, subscribe, toPromise } from 'wonka';

import { queryOperation } from '../test-utils';
import { makeFetchSource } from './fetchSource';

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

describe('on success', () => {
  beforeEach(() => {
    fetch.mockResolvedValue({
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
      json: jest.fn().mockResolvedValue(response),
    });
  });

  it('returns response data', async () => {
    const fetchOptions = {};
    const data = await pipe(
      makeFetchSource(queryOperation, 'https://test.com/graphql', fetchOptions),
      toPromise
    );

    expect(data).toMatchSnapshot();

    expect(fetch).toHaveBeenCalled();
    expect(fetch.mock.calls[0][0]).toBe('https://test.com/graphql');
    expect(fetch.mock.calls[0][1]).toBe(fetchOptions);
  });

  it('uses the mock fetch if given', async () => {
    const fetchOptions = {};
    const fetcher = jest.fn().mockResolvedValue({
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
      json: jest.fn().mockResolvedValue(response),
    });

    const data = await pipe(
      makeFetchSource(
        {
          ...queryOperation,
          context: {
            ...queryOperation.context,
            fetch: fetcher,
          },
        },
        'https://test.com/graphql',
        fetchOptions
      ),
      toPromise
    );

    expect(data).toMatchSnapshot();
    expect(fetch).not.toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalled();
  });
});

describe('on error', () => {
  beforeEach(() => {
    fetch.mockResolvedValue({
      status: 400,
      headers: {
        'content-type': 'application/json',
      },
      json: jest.fn().mockResolvedValue({}),
    });
  });

  it('returns error data', async () => {
    const fetchOptions = {};
    const data = await pipe(
      makeFetchSource(queryOperation, 'https://test.com/graphql', fetchOptions),
      toPromise
    );

    expect(data).toMatchSnapshot();
  });

  it('returns error data with status 400 and manual redirect mode', async () => {
    const data = await pipe(
      makeFetchSource(queryOperation, 'https://test.com/graphql', {
        redirect: 'manual',
      }),
      toPromise
    );

    expect(data).toMatchSnapshot();
  });

  it('ignores the error when a result is available', async () => {
    const data = await pipe(
      makeFetchSource(queryOperation, 'https://test.com/graphql', {}),
      toPromise
    );

    expect(data).toMatchSnapshot();
  });
});

describe('on teardown', () => {
  it('does not start the outgoing request on immediate teardowns', () => {
    fetch.mockRejectedValueOnce(abortError);

    const { unsubscribe } = pipe(
      makeFetchSource(queryOperation, 'https://test.com/graphql', {}),
      subscribe(fail)
    );

    unsubscribe();
    expect(fetch).toHaveBeenCalledTimes(0);
    expect(abort).toHaveBeenCalledTimes(1);
  });

  it('aborts the outgoing request', async () => {
    fetch.mockRejectedValueOnce(abortError);

    const { unsubscribe } = pipe(
      makeFetchSource(queryOperation, 'https://test.com/graphql', {}),
      subscribe(fail)
    );

    await Promise.resolve();

    unsubscribe();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(abort).toHaveBeenCalledTimes(1);
  });
});
