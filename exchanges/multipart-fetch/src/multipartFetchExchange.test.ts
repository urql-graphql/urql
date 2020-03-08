import { Client, OperationResult, OperationType } from '@urql/core';
import { empty, fromValue, pipe, Source, subscribe, toPromise } from 'wonka';
import gql from 'graphql-tag';
import { print } from 'graphql';

import { multipartFetchExchange, convertToGet } from './multipartFetchExchange';
import { uploadOperation, queryOperation } from './utils';

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
    expect(fetch.mock.calls[0][1].headers).toEqual({
      'content-type': 'multipart/form-data',
    });
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
      json: jest.fn().mockResolvedValue(response),
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
});

describe('on teardown', () => {
  it('does not start the outgoing request on immediate teardowns', () => {
    fetch.mockRejectedValueOnce(abortError);

    const { unsubscribe } = pipe(
      fromValue(queryOperation),
      multipartFetchExchange(exchangeArgs),
      subscribe(fail)
    );

    unsubscribe(undefined);
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

    unsubscribe(undefined);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(abort).toHaveBeenCalledTimes(1);
  });

  it('does not call the query', () => {
    pipe(
      fromValue({
        ...queryOperation,
        operationName: 'teardown' as OperationType,
      }),
      multipartFetchExchange(exchangeArgs),
      subscribe(fail)
    );

    expect(fetch).toHaveBeenCalledTimes(0);
    expect(abort).toHaveBeenCalledTimes(0);
  });
});

describe('convert for GET', () => {
  it('should do a basic conversion', () => {
    const query = `query ($id: ID!) { node(id: $id) { id } }`;
    const variables = { id: 2 };
    expect(convertToGet('http://localhost:3000', { query, variables })).toBe(
      `http://localhost:3000?query=${encodeURIComponent(
        query
      )}&variables=${encodeURIComponent(JSON.stringify(variables))}`
    );
  });

  it('should do a basic conversion with fragments', () => {
    const nodeFragment = gql`
      fragment nodeFragment on Node {
        id
      }
    `;

    const variables = { id: 2 };
    const query = print(gql`
      query($id: ID!) {
        node(id: $id) {
          ...nodeFragment
        }
      }
      ${nodeFragment}
    `);

    expect(convertToGet('http://localhost:3000', { query, variables })).toBe(
      `http://localhost:3000?query=${encodeURIComponent(
        query
      )}&variables=${encodeURIComponent(JSON.stringify(variables))}`
    );
  });
});
