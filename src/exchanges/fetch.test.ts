import { empty, fromValue, pipe, Source, subscribe, toPromise } from 'wonka';
import { Client } from '../client';
import { queryOperation } from '../test-utils';
import { OperationResult, OperationType } from '../types';
import { fetchExchange } from './fetch';

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

beforeEach(() => {
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

it('returns response data from fetch', async () => {
  fetch.mockResolvedValue({
    status: 200,
    json: jest.fn().mockResolvedValue(response),
  });

  const fetchOptions = jest.fn().mockReturnValue({});

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
});

it('returns error data from fetch', async () => {
  fetch.mockResolvedValue({
    status: 400,
    json: jest.fn().mockResolvedValue(response),
  });

  const data = await pipe(
    fromValue(queryOperation),
    fetchExchange(exchangeArgs),
    toPromise
  );

  expect(data).toMatchSnapshot();
});

it('calls cancel when the Observable is cancelled', () => {
  fetch.mockReturnValue(Promise.reject(abortError));

  const [unsubscribe] = pipe(
    fromValue(queryOperation),
    fetchExchange(exchangeArgs),
    subscribe(fail)
  );

  unsubscribe();
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(abort).toHaveBeenCalledTimes(1);
});

it('should not start the operation when teardown gets passed', () => {
  pipe(
    fromValue({
      ...queryOperation,
      operationName: 'teardown' as OperationType,
    }),
    fetchExchange(exchangeArgs),
    subscribe(fail)
  );

  expect(fetch).toHaveBeenCalledTimes(0);
  expect(abort).toHaveBeenCalledTimes(0);
});
