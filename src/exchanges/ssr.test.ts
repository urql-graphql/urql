import { makeSubject, pipe, map, publish, forEach, Subject } from 'wonka';

import { Client } from '../client';
import { queryOperation, queryResponse } from '../test-utils';
import { ExchangeIO, Operation } from '../types';
import { ssrExchange } from './ssr';

let forward: ExchangeIO;
let exchangeInput;
let client: Client;
let input: Subject<Operation>;
let output;

beforeEach(() => {
  input = makeSubject<Operation>();
  output = jest.fn();
  forward = ops$ => pipe(ops$, map(output));
  client = { suspense: true } as any;
  exchangeInput = { forward, client };
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
      data: queryResponse.data,
      error: undefined,
    },
  });
});

it('resolves cached query results correctly', () => {
  const onPush = jest.fn();

  const ssr = ssrExchange({
    initialState: { [queryOperation.key]: queryResponse as any },
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

it('deletes cached results in non-suspense environments', () => {
  client.suspense = false;
  const onPush = jest.fn();
  const ssr = ssrExchange();

  ssr.restoreData({ [queryOperation.key]: queryResponse as any });
  expect(Object.keys(ssr.extractData()).length).toBe(1);

  const { source: ops$, next } = input;
  const exchange = ssr(exchangeInput)(ops$);

  pipe(exchange, forEach(onPush));
  next(queryOperation);

  expect(Object.keys(ssr.extractData()).length).toBe(0);
  expect(onPush).toHaveBeenCalledWith(queryResponse);

  // NOTE: The operation should not be duplicated
  expect(output).not.toHaveBeenCalled();
});
