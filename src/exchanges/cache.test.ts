import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { cacheExchange, afterMutation } from './cache';
import {
  queryOperation,
  queryResponse,
  mutationOperation,
  mutationResponse,
  subscriptionResponse,
  subscriptionOperation,
} from '../test-utils';
import { Operation } from '../types';

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
  // @ts-ignore
  const exchange = cacheExchange(subject)(forwardMock)(stream);
  const completed = exchange.toPromise();

  stream.next(queryOperation);
  stream.complete();
  await completed;

  expect(calls).toBe(1);
});

it('caches queries', async () => {
  // @ts-ignore
  const exchange = cacheExchange(subject)(forwardMock)(stream);
  const completed = exchange.toPromise();

  stream.next(queryOperation);
  stream.next(queryOperation);
  stream.complete();
  await completed;

  expect(calls).toBe(1);
});

it("doesn't cache mutations", async () => {
  response = mutationResponse;
  // @ts-ignore
  const exchange = cacheExchange(subject)(forwardMock)(stream);
  const completed = exchange.toPromise();

  stream.next(mutationOperation);
  stream.next(mutationOperation);
  stream.complete();
  await completed;

  expect(calls).toBe(2);
});

it('retriggers query operation when mutation occurs', () => {
  const typename = 'ToDo';
  const cache = new Map([[1, queryResponse]]);
  const typenames = new Map([[typename, [1]]]);

  afterMutation(
    // @ts-ignore
    {
      data: {
        data: {
          todos: [
            {
              id: 1,
              __typename: typename,
            },
          ],
        },
      },
    },
    cache,
    typenames,
    subject
  );

  expect(subject.next).toBeCalledWith(queryOperation);
});

it('forwards subscriptions', async () => {
  response = subscriptionResponse;
  // @ts-ignore
  const exchange = cacheExchange(subject)(forwardMock)(stream);
  const completed = exchange.toPromise();

  stream.next(subscriptionOperation);
  stream.next(subscriptionOperation);
  stream.complete();
  await completed;

  expect(calls).toBe(2);
});
