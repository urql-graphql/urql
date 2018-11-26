import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { cacheExchange } from './cache';
import {
  queryOperation,
  queryResponse,
  mutationOperation,
  mutationResponse,
  subscriptionResponse,
  subscriptionOperation,
} from '../samples';
import { Operation } from '../types';

let stream = new Subject<Operation>();
let calls = 0;
let response = queryResponse;

const forwardMock = (s: Observable<Operation>) =>
  s.pipe(
    map(() => {
      calls += 1;
      return response;
    })
  );

beforeEach(() => {
  calls = 0;
  response = queryResponse;
  stream = new Subject<Operation>();
});

it('forwards to next exchange when no cache is found', async () => {
  const exchange = cacheExchange(forwardMock)(stream);
  const completed = exchange.toPromise();

  stream.next(queryOperation);
  stream.complete();
  await completed;

  expect(calls).toBe(1);
});

it('caches queries', async () => {
  const exchange = cacheExchange(forwardMock)(stream);
  const completed = exchange.toPromise();

  stream.next(queryOperation);
  stream.next(queryOperation);
  stream.complete();
  await completed;

  expect(calls).toBe(1);
});

it("doesn't cache mutations", async () => {
  response = mutationResponse;
  const exchange = cacheExchange(forwardMock)(stream);
  const completed = exchange.toPromise();

  stream.next(mutationOperation);
  stream.next(mutationOperation);
  stream.complete();
  await completed;

  expect(calls).toBe(2);
});

it('forwards subscriptions', async () => {
  response = subscriptionResponse;
  const exchange = cacheExchange(forwardMock)(stream);
  const completed = exchange.toPromise();

  stream.next(subscriptionOperation);
  stream.next(subscriptionOperation);
  stream.complete();
  await completed;

  expect(calls).toBe(2);
});
