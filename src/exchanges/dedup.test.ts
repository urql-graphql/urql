import {
  filter,
  makeSubject,
  map,
  pipe,
  publish,
  Source,
  Subject,
} from 'wonka';

import {
  mutationOperation,
  mutationResponse,
  queryOperation,
  queryResponse,
} from '../test-utils';

import { Client } from '../lib/client';
import { Operation } from '../types';
import { dedupeExchange } from './dedup';

let shouldRespond = false;
let exchangeArgs;
let forwardedOperations: Operation[];
let input: Subject<Operation>;

beforeEach(() => {
  shouldRespond = false;
  forwardedOperations = [];
  input = makeSubject<Operation>();

  // Collect all forwarded operations
  const forward = (s: Source<Operation>) => {
    return pipe(
      s,
      map(op => {
        forwardedOperations.push(op);
        return queryResponse;
      }),
      filter(() => !!shouldRespond)
    );
  };

  exchangeArgs = { forward, subject: {} as Client };
});

it('forwards query operations correctly', async () => {
  const [ops$, next, complete] = input;
  const exchange = dedupeExchange(exchangeArgs)(ops$);

  publish(exchange);
  next(queryOperation);
  complete();
  expect(forwardedOperations.length).toBe(1);
});

it('forwards only non-pending query operations', async () => {
  shouldRespond = false; // We filter out our mock responses
  const [ops$, next, complete] = input;
  const exchange = dedupeExchange(exchangeArgs)(ops$);

  publish(exchange);
  next(queryOperation);
  next(queryOperation);
  complete();
  expect(forwardedOperations.length).toBe(1);
});

it('forwards duplicate query operations as usual after they respond', async () => {
  shouldRespond = true; // Response will immediately resolve
  const [ops$, next, complete] = input;
  const exchange = dedupeExchange(exchangeArgs)(ops$);

  publish(exchange);
  next(queryOperation);
  next(queryOperation);
  complete();
  expect(forwardedOperations.length).toBe(2);
});

it('always forwards mutation operations without deduplicating them', async () => {
  shouldRespond = false; // We filter out our mock responses
  const [ops$, next, complete] = input;
  const exchange = dedupeExchange(exchangeArgs)(ops$);

  publish(exchange);
  next(mutationOperation);
  next(mutationOperation);
  complete();
  expect(forwardedOperations.length).toBe(2);
});
