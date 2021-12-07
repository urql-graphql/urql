import { makeSubject, pipe, map, publish, forEach, Subject } from 'wonka';

import { Client } from '../client';
import { queryOperation, queryResponse } from '../test-utils';
import { ExchangeIO, Operation, OperationResult } from '../types';
import { CombinedError } from '../utils';
import { ssrExchange } from './ssr';

let forward: ExchangeIO;
let exchangeInput;
let client: Client;
let input: Subject<Operation>;
let output;

const serializedQueryResponse = {
  ...queryResponse,
  data: JSON.stringify(queryResponse.data),
};

beforeEach(() => {
  input = makeSubject<Operation>();
  output = jest.fn(operation => ({ operation }));
  forward = ops$ => pipe(ops$, map(output));
  client = { suspense: true } as any;
  exchangeInput = { forward, client };
});

afterEach(() => {
  output.mockClear();
});

it('caches query results correctly', () => {
  output.mockReturnValueOnce(queryResponse);

  const ssr = ssrExchange();
  const { source: ops$, next } = input;
  const exchange = ssr(exchangeInput)(ops$);

  publish(exchange);
  next(queryOperation);

  const data = ssr.extractData();
  expect(Object.keys(data)).toEqual(['' + queryOperation.key]);

  expect(data).toEqual({
    [queryOperation.key]: {
      data: serializedQueryResponse.data,
      error: undefined,
    },
  });
});

it('serializes query results quickly', () => {
  const queryResponse: OperationResult = {
    operation: queryOperation,
    data: {
      user: {
        name: 'Clive',
      },
    },
  };

  const serializedQueryResponse = {
    ...queryResponse,
    data: JSON.stringify(queryResponse.data),
  };

  output.mockReturnValueOnce(queryResponse);

  const ssr = ssrExchange();
  const { source: ops$, next } = input;
  const exchange = ssr(exchangeInput)(ops$);

  publish(exchange);
  next(queryOperation);
  queryResponse.data.user.name = 'Not Clive';

  const data = ssr.extractData();
  expect(Object.keys(data)).toEqual(['' + queryOperation.key]);

  expect(data).toEqual({
    [queryOperation.key]: {
      data: serializedQueryResponse.data,
      error: undefined,
    },
  });
});

it('caches errored query results correctly', () => {
  output.mockReturnValueOnce({
    ...queryResponse,
    data: null,
    error: new CombinedError({
      graphQLErrors: ['Oh no!'],
    }),
  });

  const ssr = ssrExchange();
  const { source: ops$, next } = input;
  const exchange = ssr(exchangeInput)(ops$);

  publish(exchange);
  next(queryOperation);

  const data = ssr.extractData();
  expect(Object.keys(data)).toEqual(['' + queryOperation.key]);

  expect(data).toEqual({
    [queryOperation.key]: {
      data: 'null',
      error: {
        graphQLErrors: [
          {
            extensions: {},
            message: 'Oh no!',
            path: undefined,
          },
        ],
        networkError: undefined,
      },
    },
  });
});

it('caches extensions when includeExtensions=true', () => {
  output.mockReturnValueOnce({
    ...queryResponse,
    extensions: {
      foo: 'bar',
    },
  });

  const ssr = ssrExchange({
    includeExtensions: true,
  });
  const { source: ops$, next } = input;
  const exchange = ssr(exchangeInput)(ops$);

  publish(exchange);
  next(queryOperation);

  const data = ssr.extractData();
  expect(Object.keys(data)).toEqual(['' + queryOperation.key]);

  expect(data).toEqual({
    [queryOperation.key]: {
      data: '{"user":{"name":"Clive"}}',
      extensions: '{"foo":"bar"}',
    },
  });
});

it('caches complex GraphQLErrors in query results correctly', () => {
  output.mockReturnValueOnce({
    ...queryResponse,
    data: null,
    error: new CombinedError({
      graphQLErrors: [
        {
          message: 'Oh no!',
          path: ['Query'],
          extensions: { test: true },
        },
      ],
    }),
  });

  const ssr = ssrExchange();
  const { source: ops$, next } = input;
  const exchange = ssr(exchangeInput)(ops$);

  publish(exchange);
  next(queryOperation);

  const error = ssr.extractData()[queryOperation.key]!.error;

  expect(error).toHaveProperty('graphQLErrors.0.message', 'Oh no!');
  expect(error).toHaveProperty('graphQLErrors.0.path', ['Query']);
  expect(error).toHaveProperty('graphQLErrors.0.extensions.test', true);
});

it('resolves cached query results correctly', () => {
  const onPush = jest.fn();

  const ssr = ssrExchange({
    initialState: { [queryOperation.key]: serializedQueryResponse as any },
  });

  const { source: ops$, next } = input;
  const exchange = ssr(exchangeInput)(ops$);

  pipe(exchange, forEach(onPush));
  next(queryOperation);

  const data = ssr.extractData();
  expect(Object.keys(data).length).toBe(1);
  expect(output).not.toHaveBeenCalled();
  expect(onPush).toHaveBeenCalledWith(queryResponse);
});

it('resolves deferred, cached query results correctly', () => {
  const onPush = jest.fn();

  const ssr = ssrExchange({
    isClient: true,
    initialState: {
      [queryOperation.key]: {
        hasNext: true,
        ...(serializedQueryResponse as any),
      },
    },
  });

  const { source: ops$, next } = input;
  const exchange = ssr(exchangeInput)(ops$);

  pipe(exchange, forEach(onPush));
  next(queryOperation);

  const data = ssr.extractData();
  expect(Object.keys(data).length).toBe(1);
  expect(output).toHaveBeenCalledTimes(1);
  expect(onPush).toHaveBeenCalledTimes(2);
  expect(onPush.mock.calls[1][0]).toEqual({ hasNext: true, ...queryResponse });
});

it('deletes cached results in non-suspense environments', async () => {
  client.suspense = false;
  const onPush = jest.fn();
  const ssr = ssrExchange();

  ssr.restoreData({ [queryOperation.key]: serializedQueryResponse as any });
  expect(Object.keys(ssr.extractData()).length).toBe(1);

  const { source: ops$, next } = input;
  const exchange = ssr(exchangeInput)(ops$);

  pipe(exchange, forEach(onPush));
  next(queryOperation);

  await Promise.resolve();

  expect(Object.keys(ssr.extractData()).length).toBe(0);
  expect(onPush).toHaveBeenCalledWith(queryResponse);

  // NOTE: The operation should not be duplicated
  expect(output).not.toHaveBeenCalled();
});

it('never allows restoration of invalidated results', async () => {
  client.suspense = false;

  const onPush = jest.fn();
  const initialState = { [queryOperation.key]: serializedQueryResponse as any };

  const ssr = ssrExchange({
    isClient: true,
    initialState: { ...initialState },
  });

  const { source: ops$, next } = input;
  const exchange = ssr(exchangeInput)(ops$);

  pipe(exchange, forEach(onPush));
  next(queryOperation);

  await Promise.resolve();

  expect(Object.keys(ssr.extractData()).length).toBe(0);
  expect(onPush).toHaveBeenCalledTimes(1);
  expect(output).not.toHaveBeenCalled();

  ssr.restoreData(initialState);
  expect(Object.keys(ssr.extractData()).length).toBe(0);

  next(queryOperation);
  expect(onPush).toHaveBeenCalledTimes(2);
  expect(output).toHaveBeenCalledTimes(1);
});
