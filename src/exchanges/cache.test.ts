import { forEach, makeSubject, map, pipe, publish, Source, Subject } from 'wonka';

import {
  mutationOperation,
  mutationResponse,
  queryOperation,
  queryResponse,
  subscriptionOperation,
  subscriptionResponse,
} from '../test-utils';

import { Operation } from '../types';
import { afterMutation, cacheExchange } from './cache';

let response;
let exchangeArgs;
let forwardedOperations: Operation[];
let reboundOperations: Operation[];
let input: Subject<Operation>;
let subject: Subject<Operation>;

beforeEach(() => {
  response = queryResponse;
  forwardedOperations = [];
  reboundOperations = [];
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

  // Collect all operations sent to the subject
  subject = makeSubject<Operation>();
  pipe(subject[0], forEach(op => reboundOperations.push(op)));

  exchangeArgs = { forward, subject };
});

it('forwards to next exchange when no cache is found', () => {
  const [ops$, next, complete] = input;
  const exchange = cacheExchange(exchangeArgs)(ops$);

  publish(exchange);
  next(queryOperation);
  complete();
  expect(forwardedOperations.length).toBe(1);
  expect(reboundOperations.length).toBe(0);
});

it('caches queries', () => {
  const [ops$, next, complete] = input;
  const exchange = cacheExchange(exchangeArgs)(ops$);

  publish(exchange);
  next(queryOperation);
  next(queryOperation);
  complete();
  expect(forwardedOperations.length).toBe(1);
  expect(reboundOperations.length).toBe(0);
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
  expect(reboundOperations.length).toBe(0);
});

it('retriggers query operation when mutation occurs', () => {
  const typename = 'ExampleType';
  const resultCache = new Map([['test', queryResponse]]);
  const operationCache = { [typename]: new Set(['test']) };

  afterMutation(resultCache, operationCache, subject)({
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

  expect(reboundOperations.length).toBe(1);
});

it('forwards subscriptions', () => {
  response = subscriptionResponse;
  const [ops$, next, complete] = input;
  const exchange = cacheExchange(exchangeArgs)(ops$);

  publish(exchange);
  next(subscriptionOperation);
  next(subscriptionOperation);
  complete();
  expect(forwardedOperations.length).toBe(2);
  expect(reboundOperations.length).toBe(0);
});
