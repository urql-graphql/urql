import { makeSubject, map, pipe, publish, Source, Subject } from 'wonka';
import { Client } from '../lib/client';
import {
  mutationOperation,
  mutationResponse,
  queryOperation,
  queryResponse,
  subscriptionOperation,
  subscriptionResult,
} from '../test-utils';
import { Operation } from '../types';
import { afterMutation, cacheExchange } from './cache';

let response;
let exchangeArgs;
let forwardedOperations: Operation[];
let reexecuteOperation;
let input: Subject<Operation>;

beforeEach(() => {
  response = queryResponse;
  forwardedOperations = [];
  reexecuteOperation = jest.fn();
  input = makeSubject<Operation>();

  // Collect all forwarded operations
  const forward = (s: Source<Operation>) => {
    return pipe(
      s,
      map(op => {
        forwardedOperations.push(op);
        return response;
      })
    );
  };

  const client = {
    reexecuteOperation: reexecuteOperation as any,
  } as Client;

  exchangeArgs = { forward, client };
});

it('forwards to next exchange when no cache is found', () => {
  const [ops$, next, complete] = input;
  const exchange = cacheExchange(exchangeArgs)(ops$);

  publish(exchange);
  next(queryOperation);
  complete();
  expect(forwardedOperations.length).toBe(1);
  expect(reexecuteOperation).not.toBeCalled();
});

it('caches queries', () => {
  const [ops$, next, complete] = input;
  const exchange = cacheExchange(exchangeArgs)(ops$);

  publish(exchange);
  next(queryOperation);
  next(queryOperation);
  complete();
  expect(forwardedOperations.length).toBe(1);
  expect(reexecuteOperation).not.toBeCalled();
});

it("doesn't cache mutations", () => {
  response = mutationResponse;
  const [ops$, next, complete] = input;
  const exchange = cacheExchange(exchangeArgs)(ops$);

  publish(exchange);
  next(mutationOperation);
  next(mutationOperation);
  complete();
  expect(forwardedOperations.length).toBe(2);
  expect(reexecuteOperation).not.toBeCalled();
});

it('retriggers query operation when mutation occurs', () => {
  const typename = 'ExampleType';
  const resultCache = new Map([['test', queryResponse]]);
  const operationCache = { [typename]: new Set(['test']) };

  afterMutation(resultCache, operationCache, exchangeArgs.client)({
    ...mutationResponse,
    data: {
      todos: [
        {
          id: 1,
          __typename: typename,
        },
      ],
    },
  });

  expect(reexecuteOperation).toBeCalledTimes(1);
});

it('forwards subscriptions', () => {
  response = subscriptionResult;
  const [ops$, next, complete] = input;
  const exchange = cacheExchange(exchangeArgs)(ops$);

  publish(exchange);
  next(subscriptionOperation);
  next(subscriptionOperation);
  complete();
  expect(forwardedOperations.length).toBe(2);
  expect(reexecuteOperation).not.toBeCalled();
});
