import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
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

const subject = {
  next: jest.fn(),
};
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
  subject.next.mockClear();
});

it('forwards to next exchange when no cache is found', async () => {
  const initialArgs = { forward: forwardMock, subject };

  // @ts-ignore
  const exchange = cacheExchange(initialArgs)(stream);
  const completed = exchange.toPromise();

  stream.next(queryOperation);
  stream.complete();
  await completed;

  expect(calls).toBe(1);
});

it('caches queries', async () => {
  const initialArgs = { forward: forwardMock, subject };

  // @ts-ignore
  const exchange = cacheExchange(initialArgs)(stream);
  const completed = exchange.toPromise();

  stream.next(queryOperation);
  stream.next(queryOperation);
  stream.complete();
  await completed;

  expect(calls).toBe(1);
});

it("doesn't cache mutations", async () => {
  response = mutationResponse;
  const initialArgs = { forward: forwardMock, subject };

  // @ts-ignore
  const exchange = cacheExchange(initialArgs)(stream);
  const completed = exchange.toPromise();

  stream.next(mutationOperation);
  stream.next(mutationOperation);
  stream.complete();
  await completed;

  expect(calls).toBe(2);
});

it('retriggers query operation when mutation occurs', () => {
  const typename = 'ToDo';
  const resultCache = new Map([['test', queryResponse]]);
  const operationCache = { [typename]: new Set(['test']) };

  afterMutation(
    resultCache,
    operationCache,
    // @ts-ignore
    subject
  )({
    data: {
      todos: [
        {
          id: 1,
          __typename: typename,
        },
      ],
    },
  });

  expect(subject.next).toBeCalledWith(queryOperation);
});

it('forwards subscriptions', async () => {
  response = subscriptionResponse;
  const initialArgs = { forward: forwardMock, subject };

  // @ts-ignore
  const exchange = cacheExchange(initialArgs)(stream);
  const completed = exchange.toPromise();

  stream.next(subscriptionOperation);
  stream.next(subscriptionOperation);
  stream.complete();
  await completed;

  expect(calls).toBe(2);
});
